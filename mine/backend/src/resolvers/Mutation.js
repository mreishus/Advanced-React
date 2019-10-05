const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: Check if they're logged in
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          ...args
        }
      },
      info
    );
    return item;
  },
  updateItem(parent, args, ctx, info) {
    const updates = { ...args };
    delete updates.id;
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        }
      },
      info
    );
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // Find item
    const item = await ctx.db.query.item(
      {
        where
      },
      `{ id title }`
    );
    // Is allow?
    // TODO
    // Delete it
    return ctx.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    // hash password
    const password = await bcrypt.hash(args.password, 10);
    // create the user in the database
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: {
            set: ["USER"]
          }
        }
      },
      info
    );
    // Create JWT token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // Set JWT on the response cookie
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year
    });
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // is there a user w/ that email
    const user = await ctx.db.query.user({
      where: {
        email
      }
    });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // is password correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error(`Invalid Password`);
    }
    // make jwt token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set cookie w/ token
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year
    });
    // return user
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");
    return { message: "Goodbye!" };
  },
  async requestReset(parent, args, ctx, info) {
    // Is a real user?
    const user = await ctx.db.query.user({
      where: { email: args.email }
    });
    if (!user) {
      throw new Error("No user found for that email " + args.email);
    }
    // Set a reset token and expiration on that user
    const resetToken = (await promisify(randomBytes)(20)).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    });
    console.log(res);
    // Email them that token
    return { message: "Goodbye!" };
  },
  async resetPassword(parent, args, ctx, info) {
    // Check if PW match
    if (args.password != args.confirmPassword) {
      throw new Error("Passwords dont match");
    }
    // Check if legit reset token
    // Check if it's expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });
    if (!user) {
      throw new Error("invalid reset token");
    }
    // Hash their new password
    const password = await bcrypt.hash(args.password, 10);
    // Save new password and remove reset token + expiration
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    // Generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // Set JWT Token
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    // Return new user
    return updatedUser;
  }
};

module.exports = Mutations;
