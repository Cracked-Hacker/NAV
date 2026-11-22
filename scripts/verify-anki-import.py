"""Import the published NAV deck twice using Anki's own collection backend."""
import csv
import html
import tempfile
from pathlib import Path

from anki.collection import Collection
from anki.import_export_pb2 import ImportAnkiPackageRequest


downloads = Path(__file__).resolve().parents[1] / "downloads"
deck = downloads / "NAV_Ultimate_Muscle_Card_Set.apkg"
with (downloads / "NAV_Muscle_Cards.csv").open(encoding="utf-8-sig", newline="") as stream:
    expected = [(row["Front"], row["Back"]) for row in csv.DictReader(stream)]
assert len(expected) == 379

with tempfile.TemporaryDirectory() as directory:
    collection = Collection(str(Path(directory) / "collection.anki2"))
    try:
        for attempt in range(2):
            collection.import_anki_package(ImportAnkiPackageRequest(package_path=str(deck)))
            fields = collection.db.list("SELECT flds FROM notes ORDER BY id")
            actual = [
                tuple(html.unescape(field.replace("<br>", "\n")) for field in note.split("\x1f"))
                for note in fields
            ]
            assert actual == expected, f"Card text or order changed on import {attempt + 1}"
            assert collection.db.scalar("SELECT count(*) FROM cards") == len(expected)
    finally:
        collection.close()
print("Anki imported all 379 original card pairs. Importing again preserved all 379.")
