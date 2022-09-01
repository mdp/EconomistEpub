#!/bin/bash

cd out/epub
zip -X0 ../weekly.epub mimetype
zip -X0 -9 -r ../weekly.epub META-INF/ OEBPS/
cd -
