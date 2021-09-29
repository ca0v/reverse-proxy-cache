"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const ignore_callback_querystring_1 = require("../../cache-processor/ignore-callback-querystring");
describe("cache-processor/ignore-callback-querystring", () => {
    it("tests computeCacheKey", () => {
        [
            { out: "some&callback=2", in: "some?callback=1&callback=2" }
        ].every(test => {
            let actual = ignore_callback_querystring_1.computeCacheKey(test.in);
            assert.equal(actual, test.out);
        });
    });
    it("tests processResponse", () => {
        [
            { out: "cb2({});", in: { request: "some?callback=cb2", response: "cb1({});" } },
            { out: "{}", in: { request: "some?f=jsonp", response: "cb1({});" } },
            { out: `{"currentVersion":10.51,"id":3,"name":"Areas","parentLayerId":-1,"defaultVisibility":true,"minScale":0,"maxScale":0,"type":"Feature Layer","geometryType":"esriGeometryPolygon","description":"","copyrightText":"","editFieldsInfo":{"creationDateField":"created_date","creatorField":"created_user","editDateField":"last_edited_date","editorField":"last_edited_user"},"ownershipBasedAccessControlForFeatures":null,"syncCanReturnChanges":false,"relationships":[],"isDataVersioned":false,"supportsRollbackOnFailureParameter":true,"archivingInfo":{"supportsQueryWithHistoricMoment":false,"startArchivingMoment":-1},"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSQL":true,"supportsCalculate":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsTrueCurve":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true,"supportsSqlExpression":true},"extent":{"xmin":-121.33643621399995,"ymin":36.02318490300007,"xmax":-114.34041621399996,"ymax":38.60559936200008,"spatialReference":{"wkid":4326,"latestWkid":4326}},"drawingInfo":{"renderer":{"type":"simple","symbol":{"type":"esriSFS","style":"esriSFSSolid","color":[151,219,242,255],"outline":{"type":"esriSLS","style":"esriSLSNull","color":[0,0,0,0],"width":0}},"label":"","description":""},"transparency":0,"labelingInfo":null},"hasM":false,"hasZ":false,"allowGeometryUpdates":true,"allowTrueCurvesUpdates":false,"onlyAllowTrueCurveUpdatesByTrueCurveClients":false,"hasAttachments":false,"supportsApplyEditsWithGlobalIds":false,"htmlPopupType":"esriServerHTMLPopupTypeAsHTMLText","objectIdField":"OBJECTID","globalIdField":"","displayField":"H8MONIKER","typeIdField":"","subtypeField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","domain":null,"editable":false,"nullable":false},{"name":"H8KEY","type":"esriFieldTypeInteger","alias":"Hansen Key","domain":null,"editable":true,"nullable":true},{"name":"RuleID","type":"esriFieldTypeInteger","alias":"RuleID","domain":null,"editable":true,"nullable":true},{"name":"H8EXPDATE","type":"esriFieldTypeDate","alias":"Expiration","domain":null,"editable":true,"nullable":true,"length":8},{"name":"H8MONIKER","type":"esriFieldTypeString","alias":"H8MONIKER","domain":null,"editable":true,"nullable":true,"length":50},{"name":"H8DESCRIPTION","type":"esriFieldTypeString","alias":"H8DESCRIPTION","domain":null,"editable":true,"nullable":true,"length":50},{"name":"H8STATUS","type":"esriFieldTypeSmallInteger","alias":"H8STATUS","domain":null,"editable":true,"nullable":true},{"name":"H8SUBTYPE","type":"esriFieldTypeString","alias":"H8SUBTYPE","domain":null,"editable":true,"nullable":true,"length":50},{"name":"H8COMMENT","type":"esriFieldTypeString","alias":"H8COMMENT","domain":null,"editable":true,"nullable":true,"length":256},{"name":"H8REGION","type":"esriFieldTypeString","alias":"H8REGION","domain":null,"editable":true,"nullable":true,"length":50},{"name":"H8FLAG","type":"esriFieldTypeInteger","alias":"Flags","domain":null,"editable":true,"nullable":true},{"name":"created_user","type":"esriFieldTypeString","alias":"created_user","domain":null,"editable":false,"nullable":true,"length":255},{"name":"created_date","type":"esriFieldTypeDate","alias":"created_date","domain":null,"editable":false,"nullable":true,"length":8},{"name":"last_edited_user","type":"esriFieldTypeString","alias":"last_edited_user","domain":null,"editable":false,"nullable":true,"length":255},{"name":"last_edited_date","type":"esriFieldTypeDate","alias":"last_edited_date","domain":null,"editable":false,"nullable":true,"length":8},{"name":"STATUS","type":"esriFieldTypeSmallInteger","alias":"STATUS","domain":{"type":"codedValue","name":"AnnotationStatus","codedValues":[{"name":"Placed","code":0},{"name":"Unplaced","code":1},{"name":"Expired","code":2}],"mergePolicy":"esriMPTDefaultValue","splitPolicy":"esriSPTDuplicate"},"editable":true,"nullable":true},{"name":"EXPIRED","type":"esriFieldTypeSmallInteger","alias":"EXPIRED","domain":{"type":"range","name":"ExpireDaysType","range":[1,120],"mergePolicy":"esriMPTDefaultValue","splitPolicy":"esriSPTDefaultValue"},"editable":true,"nullable":true},{"name":"H8MONIK2","type":"esriFieldTypeString","alias":"H8MONIK2","domain":null,"editable":true,"nullable":true,"length":160}],"indexes":[{"name":"R27_pk","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":""},{"name":"S22_idx","fields":"SHAPE","isAscending":true,"isUnique":true,"description":""}],"dateFieldsTimeReference":{"timeZone":"UTC","respectsDaylightSaving":false},"types":[],"templates":[{"name":"Areas","description":"","prototype":{"attributes":{"EXPIRED":null,"H8MONIK2":null,"H8KEY":null,"RuleID":null,"H8EXPDATE":null,"H8MONIKER":null,"H8DESCRIPTION":null,"H8STATUS":null,"H8SUBTYPE":null,"H8COMMENT":null,"H8REGION":null,"H8FLAG":null,"STATUS":null}},"drawingTool":"esriFeatureEditToolPolygon"}],"maxRecordCount":1000,"supportedQueryFormats":"JSON, AMF, geoJSON","capabilities":"Create,Query,Update,Delete,Uploads,Editing","useStandardizedQueries":true}`, in: { request: "http://localhost:3002/mock/ags/rest/services/ANNOTATIONS/IPS860_ANNOTATIONS/FeatureServer/3?f=json", response: `define({"currentVersion":10.51,"id":3,"name":"Areas","parentLayerId":-1,"defaultVisibility":true,"minScale":0,"maxScale":0,"type":"Feature Layer","geometryType":"esriGeometryPolygon","description":"","copyrightText":"","editFieldsInfo":{"creationDateField":"created_date","creatorField":"created_user","editDateField":"last_edited_date","editorField":"last_edited_user"},"ownershipBasedAccessControlForFeatures":null,"syncCanReturnChanges":false,"relationships":[],"isDataVersioned":false,"supportsRollbackOnFailureParameter":true,"archivingInfo":{"supportsQueryWithHistoricMoment":false,"startArchivingMoment":-1},"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSQL":true,"supportsCalculate":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsTrueCurve":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true,"supportsSqlExpression":true},"extent":{"xmin":-121.33643621399995,"ymin":36.02318490300007,"xmax":-114.34041621399996,"ymax":38.60559936200008,"spatialReference":{"wkid":4326,"latestWkid":4326}},"drawingInfo":{"renderer":{"type":"simple","symbol":{"type":"esriSFS","style":"esriSFSSolid","color":[151,219,242,255],"outline":{"type":"esriSLS","style":"esriSLSNull","color":[0,0,0,0],"width":0}},"label":"","description":""},"transparency":0,"labelingInfo":null},"hasM":false,"hasZ":false,"allowGeometryUpdates":true,"allowTrueCurvesUpdates":false,"onlyAllowTrueCurveUpdatesByTrueCurveClients":false,"hasAttachments":false,"supportsApplyEditsWithGlobalIds":false,"htmlPopupType":"esriServerHTMLPopupTypeAsHTMLText","objectIdField":"OBJECTID","globalIdField":"","displayField":"H8MONIKER","typeIdField":"","subtypeField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","domain":null,"editable":false,"nullable":false},{"name":"H8KEY","type":"esriFieldTypeInteger","alias":"Hansen Key","domain":null,"editable":true,"nullable":true},{"name":"RuleID","type":"esriFieldTypeInteger","alias":"RuleID","domain":null,"editable":true,"nullable":true},{"name":"H8EXPDATE","type":"esriFieldTypeDate","alias":"Expiration","domain":null,"editable":true,"nullable":true,"length":8},{"name":"H8MONIKER","type":"esriFieldTypeString","alias":"H8MONIKER","domain":null,"editable":true,"nullable":true,"length":50},{"name":"H8DESCRIPTION","type":"esriFieldTypeString","alias":"H8DESCRIPTION","domain":null,"editable":true,"nullable":true,"length":50},{"name":"H8STATUS","type":"esriFieldTypeSmallInteger","alias":"H8STATUS","domain":null,"editable":true,"nullable":true},{"name":"H8SUBTYPE","type":"esriFieldTypeString","alias":"H8SUBTYPE","domain":null,"editable":true,"nullable":true,"length":50},{"name":"H8COMMENT","type":"esriFieldTypeString","alias":"H8COMMENT","domain":null,"editable":true,"nullable":true,"length":256},{"name":"H8REGION","type":"esriFieldTypeString","alias":"H8REGION","domain":null,"editable":true,"nullable":true,"length":50},{"name":"H8FLAG","type":"esriFieldTypeInteger","alias":"Flags","domain":null,"editable":true,"nullable":true},{"name":"created_user","type":"esriFieldTypeString","alias":"created_user","domain":null,"editable":false,"nullable":true,"length":255},{"name":"created_date","type":"esriFieldTypeDate","alias":"created_date","domain":null,"editable":false,"nullable":true,"length":8},{"name":"last_edited_user","type":"esriFieldTypeString","alias":"last_edited_user","domain":null,"editable":false,"nullable":true,"length":255},{"name":"last_edited_date","type":"esriFieldTypeDate","alias":"last_edited_date","domain":null,"editable":false,"nullable":true,"length":8},{"name":"STATUS","type":"esriFieldTypeSmallInteger","alias":"STATUS","domain":{"type":"codedValue","name":"AnnotationStatus","codedValues":[{"name":"Placed","code":0},{"name":"Unplaced","code":1},{"name":"Expired","code":2}],"mergePolicy":"esriMPTDefaultValue","splitPolicy":"esriSPTDuplicate"},"editable":true,"nullable":true},{"name":"EXPIRED","type":"esriFieldTypeSmallInteger","alias":"EXPIRED","domain":{"type":"range","name":"ExpireDaysType","range":[1,120],"mergePolicy":"esriMPTDefaultValue","splitPolicy":"esriSPTDefaultValue"},"editable":true,"nullable":true},{"name":"H8MONIK2","type":"esriFieldTypeString","alias":"H8MONIK2","domain":null,"editable":true,"nullable":true,"length":160}],"indexes":[{"name":"R27_pk","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":""},{"name":"S22_idx","fields":"SHAPE","isAscending":true,"isUnique":true,"description":""}],"dateFieldsTimeReference":{"timeZone":"UTC","respectsDaylightSaving":false},"types":[],"templates":[{"name":"Areas","description":"","prototype":{"attributes":{"EXPIRED":null,"H8MONIK2":null,"H8KEY":null,"RuleID":null,"H8EXPDATE":null,"H8MONIKER":null,"H8DESCRIPTION":null,"H8STATUS":null,"H8SUBTYPE":null,"H8COMMENT":null,"H8REGION":null,"H8FLAG":null,"STATUS":null}},"drawingTool":"esriFeatureEditToolPolygon"}],"maxRecordCount":1000,"supportedQueryFormats":"JSON, AMF, geoJSON","capabilities":"Create,Query,Update,Delete,Uploads,Editing","useStandardizedQueries":true});` } }
        ].every(test => {
            let result = ignore_callback_querystring_1.processResponse(test.in.request, test.in.response);
            assert.equal(result, test.out);
        });
    });
});
//# sourceMappingURL=ignore-callback-querystring.js.map