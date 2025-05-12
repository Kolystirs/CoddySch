# Используем лёгкий официальный образ Python
FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /code

# Копируем зависимости и устанавливаем
COPY app/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь проект
COPY . .

# Открываем порт FastAPI
EXPOSE 8000

# Запускаем приложение через Uvicorn
# Импортируем FastAPI-приложение из app/main.py
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
