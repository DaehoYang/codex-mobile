from importlib.resources import files
from typing import Any


def setup_codexapp() -> dict[str, Any]:
    icon_path = files(__package__).joinpath("icons", "codexui-icon.svg")
    return {
        "command": [
            "codexapp",
            "--host",
            "127.0.0.1",
            "--port",
            "{port}",
            "--no-password",
            "--no-open",
            "--no-tunnel",
            "--no-login",
        ],
        "absolute_url": False,
        "timeout": 120,
        "new_browser_tab": True,
        "launcher_entry": {
            "enabled": True,
            "title": "Codex Mobile",
            "category": "Notebook",
            "path_info": "codex/",
            "icon_path": str(icon_path),
        },
    }
