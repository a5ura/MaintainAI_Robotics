"""Portable, lossless snapshot serialization and integrity verification."""
import hashlib
import json
from backend.domain import RepositoryError

CHUNK_BYTES=262144

def serialize(value):
    return json.dumps(value,allow_nan=False,sort_keys=True,ensure_ascii=True,separators=(',',':'))

def verify(manifest,chunks):
    try:
        if manifest['format']!='json-ascii-v1' or manifest['schema_version']!=1:raise ValueError('Unknown format')
        if len(chunks)!=manifest['chunk_count']:raise ValueError('Chunk count')
        digest=hashlib.sha256();length=0;parts=[]
        for index,chunk in enumerate(chunks):
            if chunk['chunk_index']!=index:raise ValueError('Chunk order')
            content=chunk['content'].encode('ascii')
            if not content or len(content)>CHUNK_BYTES:raise ValueError('Chunk size')
            length+=len(content);digest.update(content);parts.append(chunk['content'])
        if length!=manifest['byte_length'] or digest.hexdigest()!=manifest['sha256']:raise ValueError('Integrity mismatch')
        value=json.loads(''.join(parts))
        if value['id']!=manifest['diagnosis_id']:raise ValueError('Diagnosis identity mismatch')
        return value
    except (ValueError,KeyError,TypeError,UnicodeError) as exc:
        raise RepositoryError('Diagnostic evidence is incomplete or damaged; operator recovery required',503) from exc
