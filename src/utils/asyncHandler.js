export const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {

            await fn(req, res, next)
        } catch (error) {
        
          res.status(error.code || 500).json({ success: false, message: error.message })
        }
        // Promise.resolve(fn(req,res,next)).catch((err)=>next(err))

    }
}