import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stakingRouter from "./staking";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stakingRouter);
router.use(adminRouter);

export default router;
