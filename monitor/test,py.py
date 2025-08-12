import torch
import torch.onnx

# 加载 PyTorch 模型
model = torch.load('last.pt')
model.eval()

# 定义输入张量的形状
dummy_input = torch.randn(1, 3, 224, 224)  # 根据实际情况修改

# 导出为 ONNX 格式
torch.onnx.export(model, dummy_input, 'last.onnx', export_params=True)