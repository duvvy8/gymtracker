# Machine image sources

The 16 machine images in `public/machines` come from the official Matrix Fitness United States product catalogue. The catalogue identifies every render by its exact Aura model SKU. Each source file is a transparent 1200 by 1200 PNG supplied by Matrix through the Johnson Health Tech asset service.

The application stores lossless WebP copies locally. This preserves every source pixel while reducing the full-resolution set from 9.1 MB of PNG data to 5.1 MB. Separate 600 by 600 card thumbnails add 1.6 MB and prevent the catalogue from downloading every full-resolution file. No machine image is requested from Matrix when someone uses gymtracker.

| Model  | Official source                                                                    |
| ------ | ---------------------------------------------------------------------------------- |
| G3-S10 | https://assets.jhtbrand.co/files/product/aade812e103cdbcfeebf40679e3a74723a65ef68/ |
| G3-S12 | https://assets.jhtbrand.co/files/product/f5e0e2b2c471c8da5721788764b33757ca2a72fa/ |
| G3-S20 | https://assets.jhtbrand.co/files/product/d87fdcc182e3fb569c969b36a956c3f8f912b1b3/ |
| G3-S21 | https://assets.jhtbrand.co/files/product/29b2d3ade462fee544cd0055198d87cd6b31b7eb/ |
| G3-S30 | https://assets.jhtbrand.co/files/product/a31b774d6107720f926047f05edec04edb470d09/ |
| G3-S31 | https://assets.jhtbrand.co/files/product/aa15e4179c5dfbd4f82a42da46dbca27a7e67101/ |
| G3-S40 | https://assets.jhtbrand.co/files/product/e742bda51e9e5c6784888ae1068783bdb36c4444/ |
| G3-S42 | https://assets.jhtbrand.co/files/product/f16b7a5a86c5294945f32dcc9b9dd4d75b98837d/ |
| G3-S51 | https://assets.jhtbrand.co/files/product/18cc939b95aa1f7b390f22f5611b3cad78a4afc9/ |
| G3-S60 | https://assets.jhtbrand.co/files/product/0c2ef8e6ca07d0da8cee90ca3557e293c19996e3/ |
| G3-S70 | https://assets.jhtbrand.co/files/product/9051c73da092604e62d75966c281c425455fcc41/ |
| G3-S71 | https://assets.jhtbrand.co/files/product/f66adfd5b04f7a821581096d8943532404244565/ |
| G3-S72 | https://assets.jhtbrand.co/files/product/4663d310bc0b610fbf8d8fb88c5c38329441f19d/ |
| G3-S73 | https://assets.jhtbrand.co/files/product/006a074d29fa75e1d06c5a01f369e6b1bf1cfc43/ |
| G3-S74 | https://assets.jhtbrand.co/files/product/f0c0930d191d43d467624b052a26f1304cb35a1a/ |
| G3-S75 | https://assets.jhtbrand.co/files/product/8578ae9f10530db792e2b3096f8fb06c4e19c264/ |

The G3-S52 back extension is deliberately excluded because it is not confirmed equipment for this gym.

The images remain Matrix Fitness product imagery. This repository uses them only to identify the corresponding gym equipment.
