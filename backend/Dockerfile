# =============================================================================
# ISRO NIRIKSHAN AI-Driven Dynamic ESS Intelligence - Production Dockerfile
# =============================================================================

FROM python:3.11-slim as base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/workspace/backend

WORKDIR /workspace/backend

# Install system dependencies for scientific libraries and ReportLab
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application source code
COPY . .

# Create non-root user for mission-critical security compliance
RUN useradd -m -u 1001 isro_qa && \
    chown -R isro_qa:isro_qa /workspace/backend
USER isro_qa

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
