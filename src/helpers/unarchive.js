import fs from 'fs';
import tar from 'tar-fs';
import zlib from 'zlib';
import pumpify from 'pumpify';
import fileType from 'file-type';
import readChunk from 'read-chunk';

import { getDirectoryForPath } from './cache';
import { ApplicationError } from '../lib/error';

function _getType (path) {
    const info = fileType(readChunk.sync(path, 0, 262));
    return info ? info.ext : null;
}

function _canHandle (type) {
    return type === 'gz' || type === 'tar';
}

export function canHandle (path) {
    return _canHandle(_getType(path));
}

export default function unarchive (path) {
    return new Promise((resolve, reject) => {

        const type = _getType(path);

        if (!_canHandle(type))
            throw new ApplicationError(
                `unarchive helper does not support type ${type}`
            );

        const cacheDir = getDirectoryForPath(path);

        if (cacheDir.exists)
            return resolve(cacheDir.path);

        const read = fs.createReadStream(path)
            .on('error', () => {
                throw new ApplicationError(`Failed to read file`);
            });

        let pipeline;

        if (type === 'gz')
            pipeline = pumpify([
                zlib.createUnzip(),
                tar.extract(cacheDir.path)
            ]);
        else
            pipeline = tar.extract(cacheDir.path);

        read.pipe(pipeline)
            .on('error', (...args) => {
                reject(new ApplicationError(`failed to extract archive`));
            })
            .on('finish', () => { resolve(cacheDir.path); });
    });
}
