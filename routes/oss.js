/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////




const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { BucketsApi, ObjectsApi, PostBucketsPayload } = require('forge-apis');
const { getClient, getInternalToken } = require('./common/oauth');
const config = require('../config');

let router = express.Router();

// Middleware for obtaining a token for each request.
router.use(async (req, res, next) => {
    try {
        const token = await getInternalToken();
        req.oauth_token = token;
        req.oauth_client = getClient();
        next();
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});

// GET /api/forge/oss/buckets nao existe mais
router.get('/buckets', async (req, res, next) => {
    const bucket_name = req.query.id;
    try {
        if (!bucket_name || bucket_name === '#') {
            const buckets = await new BucketsApi().getBuckets({ limit: 100 }, req.oauth_client, req.oauth_token);
            res.json(buckets.body.items.map(bucket => ({
                id: bucket.bucketKey,
                text: bucket.bucketKey.replace(config.credentials.client_id.toLowerCase() + '-', ''),
                type: 'bucket',
                children: true
            })));
        } else {
            const objects = await new ObjectsApi().getObjects(bucket_name, { limit: 100 }, req.oauth_client, req.oauth_token);
            res.json(objects.body.items.map(object => ({
                id: Buffer.from(object.objectId).toString('base64'),
                text: object.objectKey,
                type: 'object',
                children: false
            })));
        }
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});

// POST /api/forge/oss/buckets - creates a new bucket.
router.post('/buckets', async (req, res, next) => {
    let payload = new PostBucketsPayload();
    payload.bucketKey = config.credentials.client_id.toLowerCase() + '-' + req.body.bucketKey;
    payload.policyKey = 'persistent'; // expires in 24h
    try {
        await new BucketsApi().createBucket(payload, {}, req.oauth_client, req.oauth_token);
        res.status(200).end();
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});

// POST /api/forge/oss/objects - uploads new object to given bucket.
router.post('/objects', multer({ dest: 'uploads/' }).single('fileToUpload'), async (req, res, next) => {
    fs.readFile(req.file.path, async (err, data) => {
        if (err) {
            return next(err); // Pass the error to the next middleware
        }
        try {
            await new ObjectsApi().uploadObject(req.body.bucketKey, req.file.originalname, data.length, data, {}, req.oauth_client, req.oauth_token);
            res.status(200).end();
        } catch (error) {
            next(error); // Pass the error to the next middleware
        }
    });
});

module.exports = router;
