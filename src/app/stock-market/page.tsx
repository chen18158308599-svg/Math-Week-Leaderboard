import type { Metadata } from "next";
import Market from "./market";

export const metadata: Metadata = { title: "MAT Stock Market | Math Week" };
export default function StockMarketPage() { return <Market />; }
