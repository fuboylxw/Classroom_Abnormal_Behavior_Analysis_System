from ultralytics import YOLO


model = YOLO('./result/train3/yolo11.yaml')
model.load('./result/train3/weights/last.pt')

# Evaluate model performance on the validation set
# metrics = model.val()
# print(metrics)

# results = model.predict(r"D:\xpu教室学生视频数据\数据集1\images\photo31000130.png")
results = model.predict(r"D:\xpu教室学生视频数据\jishe2.0\train\images\video23_360s.png")
print(results)
results[0].show()
print(model.names)
# torch.save(model, 'model_person_1.pt')