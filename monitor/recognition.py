import os
import shutil
import sqlite3
import torch
from ultralytics import YOLO
from PIL import Image
from django.http import HttpResponse


class ImageProcessor:
    def __init__(self, folder_path):
        self.folder_path = folder_path

    def detect_images(self):
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        image_files = []
        for root, dirs, files in os.walk(self.folder_path):
            for file in files:
                if any(file.lower().endswith(ext) for ext in image_extensions):
                    image_files.append(os.path.join(root, file))
        return image_files

    def load_model(self):
        model = YOLO('../YOLOV11_innovate/yolo11.yaml')
        model.load('../last.pt')
        return model

    def recognize_image(self, model, image_path):
        results = model.predict(image_path)
        result_str = str(results)
        results[0].show()
        print(results)
        return result_str

    def save_to_database(self, image_path, result):
        image_name = os.path.basename(image_path)
        conn = sqlite3.connect('image_results.db')
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS image_results
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                     image_name TEXT,
                     image_path TEXT,
                     result TEXT)''')
        with open(image_path, 'rb') as f:
            image_data = f.read()
        c.execute("INSERT INTO image_results (image_name, image_path, result) VALUES (?,?,?)",
                  (image_name, image_path, result))
        conn.commit()
        conn.close()

    def delete_images(self, image_files):
        for image_file in image_files:
            os.remove(image_file)

    def process(self):
        image_files = self.detect_images()
        if image_files:
            model = self.load_model()
            for image_file in image_files:
                result = self.recognize_image(model, image_file)
                self.save_to_database(image_file, result)
            self.delete_images(image_files)
            return "图片处理完成"
        else:
            return "未找到图片文件"