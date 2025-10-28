from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import detect, auth, items, search, chats, admin

# สร้างตารางถ้ายังไม่มี
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lost & Found API")

# ========================
# CORS สำหรับ cookie
# ========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # frontend domain
    ],
    allow_credentials=True,      # สำคัญสำหรับ cookie
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
# รวม routers
# ========================
app.include_router(detect.router)
app.include_router(auth.router)
app.include_router(items.router)
app.include_router(search.router)
app.include_router(chats.router)
app.include_router(admin.router)

