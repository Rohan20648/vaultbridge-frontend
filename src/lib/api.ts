import axios from "axios";

const api = axios.create({
  baseURL: "https://vaultbridge-backend-production.up.railway.app/api",
  headers: { "Content-Type": "application/json" },
});

export default api;

// Startups
export const getStartups = () => api.get("/startups").then(r => r.data);
export const getStartup = (id: number) => api.get(`/startups/${id}`).then(r => r.data);
export const setupStartupDbLab = () => api.post("/startups/db-lab/setup").then(r => r.data);
export const getStartupStatusHistory = (id: number) => api.get(`/startups/${id}/status-history`).then(r => r.data);
export const getStartupFullReport = (id: number) => api.get(`/startups/${id}/full-report`).then(r => r.data);
export const getStartupCursorSummary = (id: number) => api.get(`/startups/${id}/cursor-summary`).then(r => r.data);
export const createStartup = (data: any) => api.post("/startups", data).then(r => r.data);
export const updateStartup = (id: number, data: any) => api.put(`/startups/${id}`, data).then(r => r.data);
export const deleteStartup = (id: number) => api.delete(`/startups/${id}`).then(r => r.data);

// Founders
export const getFounders = () => api.get("/founders").then(r => r.data);
export const getFounder = (id: number) => api.get(`/founders/${id}`).then(r => r.data);
export const createFounder = (data: any) => api.post("/founders", data).then(r => r.data);
export const updateFounder = (id: number, data: any) => api.put(`/founders/${id}`, data).then(r => r.data);
export const deleteFounder = (id: number) => api.delete(`/founders/${id}`).then(r => r.data);

// Sharks / Investors
export const getSharks = () => api.get("/sharks").then(r => r.data);
export const getShark = (id: number) => api.get(`/sharks/${id}`).then(r => r.data);
export const createShark = (data: any) => api.post("/sharks", data).then(r => r.data);
export const updateShark = (id: number, data: any) => api.put(`/sharks/${id}`, data).then(r => r.data);
export const deleteShark = (id: number) => api.delete(`/sharks/${id}`).then(r => r.data);

// Deals
export const getDeals = () => api.get("/deals").then(r => r.data);
export const getDeal = (id: number) => api.get(`/deals/${id}`).then(r => r.data);
export const createDeal = (data: any) => api.post("/deals", data).then(r => r.data);
export const updateDeal = (id: number, data: any) => api.put(`/deals/${id}`, data).then(r => r.data);
export const deleteDeal = (id: number) => api.delete(`/deals/${id}`).then(r => r.data);

// Products
export const getProducts = () => api.get("/products").then(r => r.data);
export const createProduct = (data: any) => api.post("/products", data).then(r => r.data);
export const updateProduct = (id: number, data: any) => api.put(`/products/${id}`, data).then(r => r.data);
export const deleteProduct = (id: number) => api.delete(`/products/${id}`).then(r => r.data);

// Portfolio
export const getPortfolio = () => api.get("/portfolio").then(r => r.data);
export const createPortfolio = (data: any) => api.post("/portfolio", data).then(r => r.data);
export const updatePortfolio = (id: number, data: any) => api.put(`/portfolio/${id}`, data).then(r => r.data);
export const deletePortfolio = (id: number) => api.delete(`/portfolio/${id}`).then(r => r.data);

// Metrics
export const getMetrics = () => api.get("/metrics").then(r => r.data);
export const createMetric = (data: any) => api.post("/metrics", data).then(r => r.data);
export const deleteMetric = (id: number) => api.delete(`/metrics/${id}`).then(r => r.data);

// Milestones
export const getMilestones = () => api.get("/milestones").then(r => r.data);
export const createMilestone = (data: any) => api.post("/milestones", data).then(r => r.data);
export const updateMilestone = (id: number, data: any) => api.put(`/milestones/${id}`, data).then(r => r.data);
export const deleteMilestone = (id: number) => api.delete(`/milestones/${id}`).then(r => r.data);

// Due Diligence
export const getDueDiligence = () => api.get("/due-diligence").then(r => r.data);
export const createDueDiligence = (data: any) => api.post("/due-diligence", data).then(r => r.data);
export const updateDueDiligence = (id: number, data: any) => api.put(`/due-diligence/${id}`, data).then(r => r.data);
export const deleteDueDiligence = (id: number) => api.delete(`/due-diligence/${id}`).then(r => r.data);

// Health Scores
export const getHealthScores = () => api.get("/health-scores").then(r => r.data);
export const createHealthScore = (data: any) => api.post("/health-scores", data).then(r => r.data);
export const deleteHealthScore = (id: number) => api.delete(`/health-scores/${id}`).then(r => r.data);

// Team History
export const getTeamHistory = () => api.get("/team-history").then(r => r.data);
export const createTeamHistory = (data: any) => api.post("/team-history", data).then(r => r.data);
export const deleteTeamHistory = (id: number) => api.delete(`/team-history/${id}`).then(r => r.data);

// Valuations
export const getValuations = () => api.get("/valuations").then(r => r.data);
export const createValuation = (data: any) => api.post("/valuations", data).then(r => r.data);
export const deleteValuation = (id: number) => api.delete(`/valuations/${id}`).then(r => r.data);

// Equity Rounds
export const getEquityRounds = () => api.get("/equity-rounds").then(r => r.data);
export const createEquityRound = (data: any) => api.post("/equity-rounds", data).then(r => r.data);
export const deleteEquityRound = (id: number) => api.delete(`/equity-rounds/${id}`).then(r => r.data);

// Lookups
export const getIndustries = () => api.get("/industries").then(r => r.data);
export const getLocations = () => api.get("/locations").then(r => r.data);
export const getProductCategories = () => api.get("/product-categories").then(r => r.data);
