from pathlib import Path
import hashlib,json,unittest
from PIL import Image
ROOT=Path(__file__).resolve().parents[3]
class ExportTests(unittest.TestCase):
    def test_store_sets_are_three_opaque_portrait_images(self):
        for device,size in [('iphone',(1320,2868)),('ipad',(2064,2752))]:
            paths=sorted((ROOT/'app-store/feature-images'/device).glob('*.png'))
            self.assertEqual(len(paths),3)
            self.assertEqual([p.name[:2] for p in paths],['01','02','03'])
            for p in paths:
                with Image.open(p) as image:
                    self.assertEqual(image.size,size)
                    self.assertEqual(image.mode,'RGB')
    def test_real_capture_provenance_and_crop_bounds(self):
        manifest=json.loads((ROOT/'app-store/design/capture-manifest.json').read_text())
        self.assertEqual(len(manifest),6)
        for item in manifest:
            p=ROOT/item['source']
            self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),item['sourceSha256'])
            with Image.open(p) as image:
                left,top,right,bottom=item['crop']
                self.assertTrue(0<=left<right<=image.width)
                self.assertTrue(0<=top<bottom<=image.height)
if __name__=='__main__':unittest.main()
