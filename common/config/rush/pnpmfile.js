"use strict";

module.exports = {
  hooks: {
    readPackage
  }
};

function readPackage(packageJson, _context) {
  // dreamopt 0.6.0 has a corrupted tarball that causes PNPM to fail during installation.
  // dreamopt 0.8.0 has a fixed tarball, and according to semver (and observation) is
  // backwards compatible with 0.6.0.
  updateDependencies(packageJson.dependencies);
  updateDependencies(packageJson.devDependencies);
  updateDependencies(packageJson.peerDependencies);

  return packageJson;
}

function updateDependencies(dependencies) {
  if (!dependencies) {
    return;
  }

  const oldVersion = dependencies['dreamopt'];
  if (!oldVersion) {
    return;
  }

  const newVersion = oldVersion.replace('0.6.0', '0.8.0');
  dependencies['dreamopt'] = newVersion;
}
