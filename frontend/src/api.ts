import axios from "axios";

const API_URL = "http://localhost:5000/api/";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (!config.headers) {
        config.headers = {};
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
})

export const authAPI = {
    signUp: (data: {name: string, email: string; password: string}) => api.post("/auth/signup", data),
    signIn: (data: {email: string; password: string}) => api.post("/auth/signin", data),
}

export const infoAPI = {
    getUsers: (search: string, pageParam: number, limit: number) => api.get("/users", {params: { search, page: pageParam, limit }}),
    getRequests: () => api.get("/requests"),
    getGroup: (id: string) => api.get("/group", {params: { id }}),
    getUser: () => api.get("/profile"),
    getMessages: (groupId: string, page: number) => api.get("/messages", {params: { groupId, page }}),
    updateLastRead: (data: {gId: number, end: number}) => api.post("/updateLastRead", data),
}
