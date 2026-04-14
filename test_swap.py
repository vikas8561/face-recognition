import urllib.request
import json
from gradio_client import Client, handle_file

with open('data/dresses.json') as f:
    d = json.load(f)
garment = 'static/images/' + d['states'][0]['dresses'][0]['garment_image']

# Create a dummy "person" image by downloading a random face
urllib.request.urlretrieve('https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/person.png', 'person.png')

client = Client('felixrosberg/face-swap')

print('Test 1: target=garment (body), source=person (face)')
res1 = client.predict(target=handle_file(garment), source=handle_file('person.png'), slider=100.0, adv_slider=100.0, settings=[], api_name='/run_inference')
print('Res1:', res1)

print('Test 2: target=person (face), source=garment (body)')
res2 = client.predict(target=handle_file('person.png'), source=handle_file(garment), slider=100.0, adv_slider=100.0, settings=[], api_name='/run_inference')
print('Res2:', res2)
