const AuditLog = require('../models/AuditLog');

const logAudit = (moduleName, actionName) => {
  return async (req, res, next) => {
    // Preserve standard send
    const originalSend = res.send;

    res.send = function (data) {
      res.send = originalSend;
      res.send(data);

      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          let parsedData = null;
          try {
            parsedData = typeof data === 'string' ? JSON.parse(data) : data;
          } catch (e) {
            parsedData = null;
          }

          AuditLog.create({
            user: req.user ? req.user._id : null,
            username: req.user ? req.user.username : 'ANONYMOUS',
            action: actionName || req.method,
            module: moduleName || 'SYSTEM',
            documentId: parsedData?.data?._id || parsedData?._id || req.params.id || null,
            details: {
              params: req.params,
              query: req.query,
              body: req.method !== 'GET' ? req.body : undefined,
            },
            ipAddress: req.ip || req.connection.remoteAddress,
          }).catch((err) => console.error('[AuditLog Error]', err.message));
        } catch (err) {
          console.error('[AuditLog Error]', err.message);
        }
      }
    };

    next();
  };
};

module.exports = { logAudit };

