import jwt from "jsonwebtoken"
import User from "../services/users/schema.js"

export const authenticate = async user => {
  const newAccessToken = await generateJWT({ _id: user._id })
  const newRefreshToken = await generateRefreshJWT({ _id: user._id })

  user.refreshToken = newRefreshToken
  await user.save()

  return { token: newAccessToken, refreshToken: newRefreshToken }
}

const generateJWT = payload =>
  new Promise((res, rej) =>
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30s" }, (err, token) => {
      if (err) rej(err)
      res(token)
    })
  )

export const verifyJWT = token =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) rej(err)
      res(decoded)
    })
  )

const generateRefreshJWT = payload =>
  new Promise((res, rej) =>
    jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1 week" }, (err, token) => {
      if (err) rej(err)
      res(token)
    })
  )

const verifyRefreshToken = token =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) rej(err)
      res(decoded)
    })
  )

export const refreshToken = async oldRefreshToken => {
  const decoded = await verifyRefreshToken(oldRefreshToken)

  const user = await User.findOne({ _id: decoded._id })

  if (!user) {
    throw new Error("Access is forbidden")
  }

  const currentRefreshToken = user.refreshToken

  if (currentRefreshToken !== oldRefreshToken) {
    throw new Error("Refresh token is wrong")
  }

  const newAccessToken = await generateJWT({ _id: user._id })
  const newRefreshToken = await generateRefreshJWT({ _id: user._id })

  user.refreshToken = newRefreshToken
  await user.save()

  return { token: newAccessToken, refreshToken: newRefreshToken }
}
