import torch
import torch.nn as nn


class SELayer(nn.Module):
    def __init__(self, channel, reduction=16):
        super(SELayer, self).__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Linear(channel, channel // reduction, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(channel // reduction, channel, bias=False),
            nn.Sigmoid()
        )

    def forward(self, x):
        b, c, _, _ = x.size()
        y = self.avg_pool(x).view(b, c)
        y = self.fc(y).view(b, c, 1, 1)
        return x * y.expand_as(x)


# 在YOLOv11的特征提取层中添加SE模块
class YOLOv11WithSE(nn.Module):
    def __init__(self, num_classes):
        super(YOLOv11WithSE, self).__init__()
        # 假设这里是YOLOv11的基础结构
        self.base_model = ...
        self.se_layer = SELayer(channel=256)  # 假设在某个特征图通道数为256的位置添加

    def forward(self, x):
        x = self.base_model(x)
        x = self.se_layer(x)
        return x
