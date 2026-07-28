from pathlib import Path

from jupyter_codexapp_proxy import setup_codexapp


def test_launcher_configuration() -> None:
    config = setup_codexapp()

    assert config["command"] == [
        "codexapp",
        "--host",
        "127.0.0.1",
        "--port",
        "{port}",
        "--no-password",
        "--no-open",
        "--no-tunnel",
        "--no-login",
    ]
    assert config["absolute_url"] is False
    assert config["new_browser_tab"] is True
    assert config["launcher_entry"]["category"] == "Notebook"
    assert config["launcher_entry"]["path_info"] == "codex/"
    assert Path(config["launcher_entry"]["icon_path"]).is_file()
