"""Narrow production website inspection and static deployment workflow."""

from __future__ import annotations

import hashlib
import os
from pathlib import Path, PurePosixPath
import re
import shlex
import sys
from datetime import datetime, timezone
from uuid import uuid4

import paramiko


NGINX_SITE = "/etc/nginx/sites-available/mychangli-production"
BACKUP_PARENT = "/var/backups/mychangli"


def required(name: str) -> str:
    value = os.environ.pop(name, "")
    if not value:
        raise RuntimeError(f"Missing required runtime value: {name}")
    return value


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def local_files(dist: Path) -> list[tuple[Path, str]]:
    files: list[tuple[Path, str]] = []
    for path in sorted(dist.rglob("*")):
        if path.is_symlink():
            raise RuntimeError("Website dist must not contain symbolic links")
        if not path.is_file():
            continue
        relative = path.relative_to(dist).as_posix()
        if relative == ".deployment-manifest.sha256" or relative.startswith(".openai/"):
            continue
        files.append((path, relative))
    if not files or not any(relative == "index.html" for _, relative in files):
        raise RuntimeError("Website dist is empty or incomplete")
    return files


def main() -> int:
    host = required("MY_CHANGLI_BACKEND_HOST")
    username = required("MY_CHANGLI_BACKEND_USER")
    identity_file = required("MY_CHANGLI_BACKEND_IDENTITY_FILE")
    key_passphrase = os.environ.pop("MY_CHANGLI_BACKEND_KEY_PASSPHRASE", "")
    sudo_password = required("MY_CHANGLI_BACKEND_SUDO_PASSWORD")
    port = int(os.environ.pop("MY_CHANGLI_BACKEND_PORT", "22"))
    action = required("MY_CHANGLI_WEBSITE_ACTION")
    dist = Path(required("MY_CHANGLI_WEBSITE_DIST")).resolve()
    files = local_files(dist)

    client = paramiko.SSHClient()
    client.load_system_host_keys()
    client.set_missing_host_key_policy(paramiko.RejectPolicy())

    def run(command: str, *, sudo: bool = False, timeout: int = 120) -> str:
        remote_command = command
        if sudo:
            remote_command = "sudo -S -p '' -- /bin/sh -c " + shlex.quote(command)
        stdin, stdout, stderr = client.exec_command(remote_command, get_pty=sudo, timeout=timeout)
        if sudo:
            stdin.write(sudo_password + "\n")
            stdin.flush()
        output = stdout.read().decode("utf-8", errors="replace")
        error = stderr.read().decode("utf-8", errors="replace")
        exit_code = stdout.channel.recv_exit_status()
        if exit_code != 0:
            message = (error or output).strip()
            raise RuntimeError(f"Remote command failed with exit code {exit_code}: {message[:500]}")
        return output.strip()

    remote_upload = ""
    backup_dir = ""
    deployment_started = False
    try:
        client.connect(
            hostname=host,
            port=port,
            username=username,
            key_filename=identity_file,
            passphrase=key_passphrase or None,
            look_for_keys=False,
            allow_agent=False,
            timeout=15,
            auth_timeout=15,
            banner_timeout=15,
        )

        matching_config_output = run(
            "/usr/bin/grep -RIlE "
            + shlex.quote(r"server_name[[:space:]]+[^;]*mychangliapp[.]cn")
            + " /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null || true",
            sudo=True,
        )
        matching_configs = sorted({line.strip() for line in matching_config_output.splitlines() if line.strip()})
        if NGINX_SITE not in matching_configs:
            matching_configs.append(NGINX_SITE)
        config_parts: list[str] = []
        for config_path in matching_configs:
            if not re.fullmatch(r"/etc/nginx/(?:sites-enabled|sites-available|conf\.d)/[A-Za-z0-9._-]+", config_path):
                raise RuntimeError("Nginx search returned a path outside approved configuration directories")
            config_parts.append(run(f"/usr/bin/cat {shlex.quote(config_path)}", sudo=True))
        nginx_config = "\n".join(config_parts)
        all_roots = {match.strip() for match in re.findall(r"(?m)^\s*root\s+([^;]+);", nginx_config)}
        root_candidates = {
            root for root in all_roots
            # Exact approved website root: sibling template/assessment sites
            # share the domain suffix but are outside this deployment.
            if root == "/var/www/mychangliapp"
        }
        if len(root_candidates) != 1:
            visible_roots = ", ".join(sorted(all_roots)) or "none"
            relevant_lines = [
                line.strip() for line in nginx_config.splitlines()
                if re.search(r"\b(server_name|root|alias|include|proxy_pass|try_files)\b", line)
            ]
            excerpt = " | ".join(relevant_lines[:24]) or "no relevant directives"
            raise RuntimeError(
                f"Unable to resolve one approved My Changli website root from Nginx; "
                f"roots: {visible_roots}; directives: {excerpt}"
            )
        configured_root = root_candidates.pop()
        if not re.fullmatch(r"/var/www/[A-Za-z0-9._/-]+", configured_root):
            raise RuntimeError("Nginx website root is outside the approved /var/www subtree")
        resolved_root = run(f"/usr/bin/readlink -f {shlex.quote(configured_root)}")
        if not resolved_root.startswith("/var/www/") or resolved_root == "/var/www":
            raise RuntimeError("Resolved website root is outside the approved /var/www subtree")
        run(f"/usr/bin/test -d {shlex.quote(resolved_root)}")
        run(f"/usr/bin/test -f {shlex.quote(resolved_root + '/index.html')}")
        run("/usr/sbin/nginx -t", sudo=True)

        print(f"Production website root: {resolved_root}")
        print("Nginx configuration: valid")
        if action == "inspect":
            print("Website production inspection completed")
            return 0
        if action != "deploy":
            raise RuntimeError("Unsupported website action")

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        remote_upload = f"/tmp/mychangli-website-{timestamp}-{uuid4().hex[:8]}"
        sftp = client.open_sftp()
        try:
            sftp.mkdir(remote_upload)
            created_dirs = {""}
            manifest_lines: list[str] = []
            for local_path, relative in files:
                parent = PurePosixPath(relative).parent
                current = ""
                for part in parent.parts:
                    if part == ".":
                        continue
                    current = f"{current}/{part}" if current else part
                    if current not in created_dirs:
                        sftp.mkdir(f"{remote_upload}/{current}")
                        created_dirs.add(current)
                sftp.put(str(local_path), f"{remote_upload}/{relative}")
                manifest_lines.append(f"{sha256_file(local_path)}  {relative}")
            with sftp.file(f"{remote_upload}/.deployment-manifest.sha256", "w") as manifest:
                manifest.write("\n".join(manifest_lines) + "\n")
        finally:
            sftp.close()

        run(
            f"cd {shlex.quote(remote_upload)} && /usr/bin/sha256sum -c .deployment-manifest.sha256 >/dev/null"
        )

        backup_dir = f"{BACKUP_PARENT}/website-{timestamp}"
        backup_command = (
            f"/usr/bin/mkdir -p {shlex.quote(backup_dir)} && "
            f"/bin/cp -a {shlex.quote(resolved_root)}/. {shlex.quote(backup_dir)}/"
        )
        run(backup_command, sudo=True, timeout=300)
        deployment_started = True

        deploy_command = (
            f"/bin/cp -a {shlex.quote(remote_upload)}/. {shlex.quote(resolved_root)}/ && "
            f"/bin/rm -f -- {shlex.quote(resolved_root + '/.deployment-manifest.sha256')}"
        )
        run(deploy_command, sudo=True, timeout=300)
        required_remote = (
            "index.html",
            "config/site-config.json",
            "assets/images/community/qq-group.jpg",
        )
        for relative in required_remote:
            run(f"/usr/bin/test -f {shlex.quote(resolved_root + '/' + relative)}", sudo=True)
        run("/usr/sbin/nginx -t", sudo=True)

        print(f"Rollback backup: {backup_dir}")
        print(f"Published static files: {len(files)}")
        print("Website deployment completed")
        return 0
    except Exception:
        if deployment_started and backup_dir:
            try:
                rollback = (
                    f"/bin/cp -a {shlex.quote(backup_dir)}/. "
                    f"{shlex.quote(resolved_root)}/ && /usr/sbin/nginx -t"
                )
                run(rollback, sudo=True, timeout=300)
                print("Deployment failed; production website was restored from backup", file=sys.stderr)
            except Exception as rollback_error:  # noqa: BLE001
                print(f"Automatic rollback failed: {rollback_error}", file=sys.stderr)
        raise
    finally:
        if remote_upload:
            try:
                run(f"/bin/rm -rf -- {shlex.quote(remote_upload)}")
            except Exception:
                pass
        client.close()
        key_passphrase = ""
        sudo_password = ""


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001 - avoid credential-adjacent tracebacks
        print(f"Website deployment failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
