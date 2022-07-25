#!/bin/bash

rm -rf out/epub && rm -rf out/*.epub && yarn cli build-epub && ./bin/zip.sh && java -jar ./epubcheck-4.2.6/epubcheck.jar out/weekly.epub