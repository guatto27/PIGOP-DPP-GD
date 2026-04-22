import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings
from app.core.security import get_password_hash


def _engine_kwargs() -> dict:
    """Pool config: SQLite no soporta pool_size ni max_overflow."""
    if "sqlite" in settings.DATABASE_URL:
        return {"echo": settings.DB_ECHO, "connect_args": {"check_same_thread": False}}
    return {
        "echo": settings.DB_ECHO,
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    }


engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs())

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """Crea todas las tablas (solo para desarrollo, en prod usar Alembic)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def init_db_data():
    """Siembra datos iniciales (Admin y Cliente DPP) si no existen."""
    async with AsyncSessionLocal() as db:
        # 1. Crear Cliente DPP
        res = await db.execute(text("SELECT 1 FROM clientes WHERE codigo_upp='DPP'"))
        if not res.fetchone():
            await db.execute(text(
                "INSERT INTO clientes (id, codigo_upp, nombre, tipo, activo, configuracion) "
                "VALUES (:id, 'DPP', 'Dirección de Programación y Presupuesto', 'centralizada', 1, '{}')"
            ), {"id": str(uuid.uuid4())})
            print("✅ Cliente DPP inicializado")

        # 2. Crear Superadmin
        res = await db.execute(text("SELECT 1 FROM usuarios WHERE email=:e"), {"e": settings.SUPERADMIN_EMAIL})
        if not res.fetchone():
            await db.execute(text(
                "INSERT INTO usuarios (id, email, password_hash, nombre_completo, rol, activo, modulos_acceso) "
                "VALUES (:id, :email, :pwd, 'Administrador PIGOP', 'superadmin', 1, '[]')"
            ), {
                "id": str(uuid.uuid4()),
                "email": settings.SUPERADMIN_EMAIL,
                "pwd": get_password_hash(settings.SUPERADMIN_PASSWORD)
            })
            print(f"✅ Superadmin {settings.SUPERADMIN_EMAIL} inicializado")

        await db.commit()
