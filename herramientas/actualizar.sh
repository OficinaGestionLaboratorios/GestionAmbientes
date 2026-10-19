#!/bin/sh
cd "$(dirname "$0")/.."
python3 -m pip install openpyxl -q
python3 herramientas/build_data.py
