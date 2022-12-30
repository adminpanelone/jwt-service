import {ServiceBroker, Service as MoleculerService} from 'moleculer';
import {Service, Action, Event, Method} from 'moleculer-decorators';
import jwt from 'jsonwebtoken';
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
let JWT_SECRET: string = process.env.JWT_SECRET;
const E = require("moleculer-web").Errors;

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
      interface JwtPayload {
        id: string;
    }
      const decoded = jwt.verify(ctx.params.token, JWT_SECRET) as JwtPayload;

      if (decoded.exp < Date.now().valueOf() / 1000) {
        return Promise.reject(new E.UnAuthorizedError(E.ERR_INVALID_TOKEN))
      }
    } catch (err) {
      return Promise.reject(new E.UnAuthorizedError(E.ERR_INVALID_TOKEN))
    }


    // if (ctx.params.token == "123456") {
    //   return Promise.resolve({id: 1, name: "John Doe"});
    // } else {
    //   return Promise.reject(new E.UnAuthorizedError(E.ERR_INVALID_TOKEN))
    // }
  }
  // With options
  // @Action({
  //     cache: false,
  //     params: {
  //         a: "number",
  //         b: "number"
  //     }
  // })
  // Login2(ctx: any) {
  //     //...
  // }

  // @Event()
  // 'event.name'(payload: any, sender: any, eventName: any) {
  //     //...
  // }

  @Method
  authorize(ctx: any, route: any, req: any, res: any) {
    let auth = req.headers["authorization"];
    if (auth && auth.startsWith("Bearer")) {
      let token = auth.slice(7);

      // Check the token
      if (token == "123456") {
        // Set the authorized user entity to `ctx.meta`
        ctx.meta.user = {id: 1, name: "John Doe"};
        return Promise.resolve(ctx);

      } else {
        // Invalid token
        return Promise.reject(new E.UnAuthorizedError(E.ERR_INVALID_TOKEN));
      }

    } else {
      // No token
      return Promise.reject(new E.UnAuthorizedError(E.ERR_NO_TOKEN));
    }

  }

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