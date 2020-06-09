const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

// const myfunc = () => {
//   const innervar = 'innervar';

//   return function innerfunc(){
//       return 'innerfunc' + innervar;
//   }
// };

// const callmyfunc = myfunc()
// console.dir(callmyfunc)
