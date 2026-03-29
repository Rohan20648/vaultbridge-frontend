import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

export default api;

// Startups
export const getStartups = () => api.get("/startups").then(r => r.data);
export const getStartup = (id: number) => api.get(`/startups/${id}`).then(r => r.data);
export const createStartup = (data: any) => api.post("/startups", data).then(r => r.data);

// Founders
export const getFounders = () => api.get("/founders").then(r => r.data);
export const createFounder = (data: any) => api.post("/founders", data).then(r => r.data);

// Sharks / Investors
export const getSharks = () => api.get("/sharks").then(r => r.data);
export const createShark = (data: any) => api.post("/sharks", data).then(r => r.data);

// Deals
export const getDeals = () => api.get("/deals").then(r => r.data);
export const createDeal = (data: any) => api.post("/deals", data).then(r => r.data);

// Products
export const getProducts = () => api.get("/products").then(r => r.data);
export const createProduct = (data: any) => api.post("/products", data).then(r => r.data);

// Portfolio
export const getPortfolio = () => api.get("/portfolio").then(r => r.data);
export const createPortfolio = (data: any) => api.post("/portfolio", data).then(r => r.data);

// Metrics
export const getMetrics = () => api.get("/metrics").then(r => r.data);

// Milestones
export const getMilestones = () => api.get("/milestones").then(r => r.data);

// Health Scores
export const getHealthScores = () => api.get("/health-scores").then(r => r.data);

// Team History
export const getTeamHistory = () => api.get("/team-history").then(r => r.data);

// Valuations
export const getValuations = () => api.get("/valuations").then(r => r.data);

// Equity Rounds
export const getEquityRounds = () => api.get("/equity-rounds").then(r => r.data);

// Lookups
export const getIndustries = () => api.get("/industries").then(r => r.data);
export const getLocations = () => api.get("/locations").then(r => r.data);
export const getProductCategories = () => api.get("/product-categories").then(r => r.data);
