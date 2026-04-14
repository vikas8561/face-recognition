import urllib.request
import json
from gradio_client import Client, handle_file
import shutil

with open('data/dresses.json') as f:
    d = json.load(f)
garment = 'static/images/' + d['states'][0]['dresses'][0]['garment_image']

client = Client('felixrosberg/face-swap')

print('Test: user face on garment')
# usually target is destination, source is face
# Let's try to swap them in another api call.

res1 = client.predict(target=handle_file(garment), source=handle_file('person.png'), slider=100.0, adv_slider=100.0, settings=[], api_name='/run_inference')
print(res1)
