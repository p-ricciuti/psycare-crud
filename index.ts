import express, { Request, Response, Router, json, NextFunction, Errback } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import supabase from "./db";
import { Todo } from "./globaltypes";

const app = express();
app.use(json());
app.use(cors());

const USERS = process.env.USERS?.split(",");

const getRouter = (user: string) => {
    const router = Router();

    router.get("/", async (req, res, next) => {
        const { data, error } = (await supabase.from<Todo>("todos").select("id, content, completed, created_at").filter("user", "eq", user));
        if (error) {
            next(new Error(error.message));
            return;
        }
        res.json(data);
    });

    router.get("/:id", async (req, res, next) => {
        const { data, error } = await supabase.from("todos").select().eq("id", req.params.id).eq("user", user).single();
        if (error) {
            next(new Error(error.message));
            return;
        }
        res.json(data);
    });

    router.post("/", async (req, res, next) => {
        const { error } = await supabase.from("todos").insert({ ...req.body, user });
        if (error) {
            next(new Error(error.message));
            return;
        }
        res.sendStatus(204);
    });

    router.patch("/:id", async (req, res, next) => {
        const { data, error } = await supabase.from("todos").update(req.body).eq("id", req.params.id).eq("user", user).single();
        if (error) next(new Error(error.message));
        res.json(data);
    });

    router.delete("/:id", async (req, res, next) => {
        const { error } = await supabase.from("todos").delete().eq("id", req.params.id).eq("user", user);
        if (error) next(new Error(error.message));
        res.sendStatus(204);
    });

    return router;
};

USERS?.forEach(user => {
    app.use(`/${user}/todos`, getRouter(user));
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({
        ok: false,
        message: err.message,
    });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log("CRUD api is listening on port " + port);
});
