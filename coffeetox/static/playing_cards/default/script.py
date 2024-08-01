from PIL import Image
import os

big_image = Image.new(mode="RGBA", size=(150 * 13, 4 * 217))

for i in range(1, 5):
    for j in range(1, 14):
        path = os.path.join(os.getcwd(), str(i), f'{j}.png')
        img = Image.open(path)
        big_image.paste(img, (150 * (j - 1), 217 * (i - 1)))
        img.close()

big_image.save('cards.png')

