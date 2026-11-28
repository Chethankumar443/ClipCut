# The speech-to-text machine: the same code, built for a graphics card (NVIDIA, CUDA 12).
# Build from the project root:  docker build -f deploy/gpu/Dockerfile -t clipcut-asr .
FROM python:3.11-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates bzip2 libasound2 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
# everything the app needs, plus the NVIDIA libraries Faster-Whisper (ctranslate2) loads on CUDA
RUN pip install --no-cache-dir -r requirements.txt \
 && pip install --no-cache-dir nvidia-cublas-cu12 "nvidia-cudnn-cu12>=9,<10"
COPY studio studio

ENV N=/usr/local/lib/python3.11/site-packages/nvidia
ENV LD_LIBRARY_PATH=$N/cublas/lib:$N/cudnn/lib \
    CLIPCUT_DATA=/data \
    CLIPCUT_ASR_PROVIDER=cuda \
    CLIPCUT_WHISPER_MODEL=base \
    PYTHONUNBUFFERED=1
VOLUME /data
EXPOSE 9000
HEALTHCHECK --interval=30s --timeout=5s --start-period=600s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:9000/healthz', timeout=4)"
# the first start downloads the Faster-Whisper model into /data/models/whisper
CMD ["sh", "-c", "python -m studio.fetch_model && python -m studio.asr_worker"]
