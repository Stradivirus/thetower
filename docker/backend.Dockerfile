FROM python:3.12-slim

ENV PYTHONUNBUFFERED 1
ENV APP_HOME /app

WORKDIR $APP_HOME

COPY back/requirements.txt $APP_HOME/requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY back/ $APP_HOME/back/

WORKDIR $APP_HOME/back

CMD ["gunicorn", "main:app", "--workers", "2", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]