import {ServiceBroker, Service as MoleculerService} from 'moleculer';
import {Service, Action, Event, Method} from 'moleculer-decorators';
import * as jwt from "jsonwebtoken"
import type {JwtPayload} from "jsonwebtoken"

require('dotenv').config({path: `.env.${process.env.NODE_ENV}`});
const JWT_SECRET = String(process.env.JWT_SECRET);
const JWT_EXIRES_IN = String(process.env.JWT_EXIRES_IN)
const REFRESH_JWT_SECRET = String(process.env.REFRESH_JWT_SECRET)
const REFRESH_JWT_EXIRES_IN = String(process.env.REFRESH_JWT_EXIRES_IN)
const E = require("moleculer-web").Errors;
const tokenList: any = {}

const settingsServiceBroker = {
  nodeID: "jwtauth-1",
  transporter: "nats://localhost:4222",
  requestTimeout: 5 * 1000
};
const broker = new ServiceBroker(settingsServiceBroker);

const settingsCreateService = {
  name: 'jwtauth',
};

@Service(settingsCreateService)
class JwtService extends MoleculerService {
  @Action()
  async auth(ctx: any) {
    try {

      const decoded: any = await jwt.verify(ctx.params.token, JWT_SECRET);

      if (decoded.exp < Date.now().valueOf() / 1000) {
        ctx.meta.$statusCode = 401;
        return Promise.reject(new E.UnAuthorizedError(E.ERR_INVALID_TOKEN))
      }
    } catch (err) {
      ctx.meta.$statusCode = 401;
      return Promise.reject(new E.UnAuthorizedError(E.ERR_INVALID_TOKEN))
    }

  }
  @Action()
  async generateAccessToken(ctx: any) {
    const user = {
      email: ctx.params.email,
      firstName: ctx.params.firstName,
      lastName: ctx.params.lastName,
      roles: ctx.params.roles
    }
    const token = jwt.sign({userId: ctx.params}, JWT_SECRET,
      {
        expiresIn: JWT_EXIRES_IN,
      }
    );
    const refreshToken = jwt.sign(user, REFRESH_JWT_SECRET, {expiresIn: REFRESH_JWT_EXIRES_IN})
    const result: JwtPayload = jwt.verify(token, JWT_SECRET) as JwtPayload

    const response = {
      status: "Logged in",
      token: token,
      refreshToken: refreshToken,
      expiresIn: result.exp,
    }

    tokenList[user.email] = response

    /*
    await redis.setAsync(`${username}_access_token`, accessToken);
    await redis.setAsync(`${username}_refresh_token`, refreshToken);
    */
    return response
  }

  // @Method
  // authorize(ctx: any, route: any, req: any, res: any) {
  //   let auth = req.headers["authorization"];
  //   if (auth && auth.startsWith("Bearer")) {
  //     let token = auth.slice(7);

  //     // Check the token
  //     if (token == "123456") {
  //       // Set the authorized user entity to `ctx.meta`
  //       ctx.meta.user = {id: 1, name: "John Doe"};
  //       return Promise.resolve(ctx);

  //     } else {
  //       // Invalid token
  //       return Promise.reject(new E.UnAuthorizedError(E.ERR_INVALID_TOKEN));
  //     }

  //   } else {
  //     // No token
  //     return Promise.reject(new E.UnAuthorizedError(E.ERR_NO_TOKEN));
  //   }

  // }

  started() { // Reserved for moleculer, fired when started
    console.log("Started!")
    //...
  }

  created() { // Reserved for moleculer, fired when created
    console.log("Created")
    //...
  }

  stopped() { // Reserved for moleculer, fired when stopped
    console.log("Stopped")
    //...
  }
}


broker.createService(JwtService);
broker.start();