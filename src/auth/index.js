import UserModel from "../services/users/schema.js"
import { verifyJWT } from "./tools.js"

export const jwtAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "")
    const decoded = await verifyJWT(token)
    const user = await UserModel.findOne({
      _id: decoded._id,
    })

    if (!user) {
      throw new Error()
    }

    req.user = user
    next()
  } catch (e) {
    console.log(e)
    const err = new Error("Please authenticate")
    err.httpStatusCode = 401
    next(err)
  }
}

export const adminOnlyMiddleware = async (req, res, next) => {
  if (req.user && req.user.role === "Admin") next()
  else {
    const err = new Error("Only for admins!")
    err.httpStatusCode = 403
    next(err)
  }
}
