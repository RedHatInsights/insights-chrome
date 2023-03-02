interface Package {
  from: string;
  eager?: boolean;
  loaded?: number;
}

interface Packages {
  [key: string]: {
    [key: string]: Package;
  };
}

/**
 * Warns applications using the shared scope if they have packages multiple times
 */
export const warnDuplicatePkg = (packages: Packages) => {
  const entries = Object.entries(packages);

  entries.forEach(([pkgName, versions]) => {
    const instances = Object.keys(versions);
    if (instances.length > 1) {
      console.log(
        `You have ${pkgName} package that is being loaded into browser multiple times. You might want to align your version with the chrome one.`
      );
      console.log(`All packages instances:`, instances);
    }
  });
};

export const packages = {
  '@openshift/dynamic-plugin-sdk': {
    '2_0_1': {
      from: 'insights-chrome',
      eager: false,
      loaded: 1,
    },
  },
  '@patternfly/quickstarts': {
    '2_3_3': {
      from: 'insights-chrome',
      eager: false,
      loaded: 1,
    },
    '3_3_3': {
      from: 'insights-chrome',
      eager: false,
      loaded: 1,
    },
  },
  '@patternfly/react-core': {
    '4_267_7': {
      from: 'insights-chrome',
      eager: false,
      loaded: 1,
    },
    '4_267_6': {
      from: 'insights-chrome',
      eager: false,
      loaded: 1,
    },
  },
  '@redhat-cloud-services/chrome': {
    '0_0_5': {
      from: 'insights-chrome',
      eager: false,
      loaded: 1,
    },
  },
  '@scalprum/react-core': {
    '0_4_0': {
      from: 'insights-chrome',
      eager: false,
      loaded: 1,
    },
  },
  '@unleash/proxy-client-react': {
    '3_5_0': {
      from: 'insights-chrome',
      eager: false,
      loaded: 1,
    },
  },
  'react-dom': {
    '17_0_2': {
      from: 'insights-chrome',
      eager: true,
      loaded: 1,
    },
  },
  'react-redux': {
    '7_2_9': {
      from: 'insights-chrome',
      eager: false,
      loaded: 1,
    },
  },
  'react-router-dom': {
    '6_6_1': {
      from: 'insights-chrome',
      eager: false,
      loaded: 1,
    },
  },
  react: {
    '16_12_0': {
      from: 'insights-chrome',
      eager: true,
    },
    '17_0_2': {
      from: 'insights-chrome',
      eager: true,
      loaded: 1,
    },
  },
};
