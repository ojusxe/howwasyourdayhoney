{
  mkShell,
  alejandra,
  bash,
  nodejs_22,
}:
mkShell rec {
  name = "ghostty.org";

  packages = [
    # Our Makefile requires a modern bash. If the developer computer is
    # running macOS then it ships with an old broken version of bash.
    # This ensures that the Makefile works. Alternately, we can just
    # fix the Makefile.
    bash
    nodejs_22

    # Required for CI for format checking.
    alejandra
  ];
}
