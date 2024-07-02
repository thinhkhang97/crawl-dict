export const parseArgs = (args) => {
  const params = {};
  args.forEach((arg, index) => {
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const value =
        args[index + 1] && !args[index + 1].startsWith('--')
          ? args[index + 1]
          : true;
      params[key] = value;
    }
  });
  return params;
};
