import express from "express"
import UserModel from "./schema.js"
import { adminOnlyMiddleware, jwtAuthMiddleware } from "../../auth/index.js"
import { authenticate, refreshToken } from "../../auth/tools.js"

const usersRouter = express.Router()

usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body)
    const { _id } = await newUser.save()

    res.status(201).send(_id)
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/", jwtAuthMiddleware, adminOnlyMiddleware, async (req, res, next) => {
  try {
    const users = await UserModel.find()
    res.send(users)
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/me", jwtAuthMiddleware, async (req, res, next) => {
  try {
    res.send(req.user)
  } catch (error) {
    next(error)
  }
})

usersRouter.delete("/me", jwtAuthMiddleware, async (req, res, next) => {
  try {
    await req.user.deleteOne()
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

usersRouter.put("/me", jwtAuthMiddleware, async (req, res, next) => {
  try {
    console.log(req.body)

    // req.user.name = req.body.name

    const updates = Object.keys(req.body)

    updates.forEach(u => (req.user[u] = req.body[u]))

    await req.user.save()

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await UserModel.checkCredentials(email, password)
    const tokens = await authenticate(user)
    res.send(tokens)
  } catch (error) {
    next(error)
  }
})

usersRouter.post("/logout", jwtAuthMiddleware, async (req, res, next) => {
  try {
    req.user.refreshToken = null
    await req.user.save()
    res.send()
  } catch (err) {
    next(err)
  }
})

usersRouter.post("/refreshToken", async (req, res, next) => {
  const oldRefreshToken = req.body.refreshToken
  if (!oldRefreshToken) {
    const err = new Error("Refresh token missing")
    err.httpStatusCode = 400
    next(err)
  } else {
    try {
      const newTokens = await refreshToken(oldRefreshToken)
      res.send(newTokens)
    } catch (error) {
      console.log(error)
      const err = new Error(error)
      err.httpStatusCode = 401
      next(err)
    }
  }
})

export default usersRouter
