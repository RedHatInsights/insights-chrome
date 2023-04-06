interface InstanceInfo {
  from: string;
  eager?: boolean;
  loaded?: number;
}

interface LoadedInstance {
  [version: string]: InstanceInfo;
}

interface Package {
  [pkgName: string]: LoadedInstance;
}

interface ToAlign {
  [appName: string]: string;
}
declare let __webpack_share_scopes__: { [x: string]: Package };

const getWebpackScope = () => {
  return __webpack_share_scopes__['default'];
};

const prepareUpdateCommands = (entries: [string, LoadedInstance][]) => {
  const toAlign: ToAlign = {};
  const visitedPackages: Record<string, string> = {};

  entries.forEach(([pkgName, pkg]) => {
    const loadedInstances = Object.entries(pkg);

    if (loadedInstances.length > 1) {
      loadedInstances.forEach(([, instanceInfo]) => {
        const loadedApp = instanceInfo.from;

        if (loadedApp && loadedApp !== 'insights-chrome' && !(visitedPackages[pkgName] === loadedApp)) {
          if (toAlign[loadedApp]) {
            toAlign[loadedApp] = `${toAlign[loadedApp]},${pkgName}`;
          } else {
            toAlign[loadedApp] = pkgName;
          }

          visitedPackages[pkgName] = loadedApp;
        }
      });
    }
  });

  return toAlign;
};

/**
 * Warns applications using the shared scope if they have packages multiple times
 */
export const warnDuplicatePkg = () => {
  const packages: Package = getWebpackScope();
  const entries = Object.entries(packages);
  const updateCommands: ToAlign = prepareUpdateCommands(entries);
  const pkgNames = Object.keys(updateCommands);

  if (pkgNames.length) {
    console.group(
      `%c[SCALPRUM]: You have following packages that is being loaded into browser multiple times. You might want to align your version with the chrome one`,
      'font-size:15px; color:#581845; padding:1px; border-radius:1px;'
    );

    const apps = Object.entries(updateCommands);

    apps.forEach(([appName, packages]) => {
      console.group(
        `[SCALPRUM]: To align ${appName} application's dependency versions to the chroming app instance version, run following command using the 'insights-interact-tool' application`
      );
      console.warn(
        `%cinsights-interact run alignPackages --app=${appName} --packages=${packages} `,
        'background:#F9F9F9; color:#581845; padding:1px; border-radius:1px;'
      );
      console.groupEnd();
    });

    console.warn(`[SCALPRUM]: All packages in the shared scope:`, packages);
    console.groupEnd();
  }
};
