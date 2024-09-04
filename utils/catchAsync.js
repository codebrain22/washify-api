module.exports = (fn) => {
  //This function will be returned and assigned to the caller
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
