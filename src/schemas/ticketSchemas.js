export const categorizeTicketSchema = {
    body: {
      type: 'object',
      required: ['task_id'],
      properties: {
        task_id: { type: 'string' },
        event: { type: 'string' },
        webhook_id: { type: 'string' },
        history_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              user: {
                type: ['object', 'null'],
                properties: {
                  id: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  };
  
  export const saveTicketsSchema = {
    body: {
      type: 'object',
      required: ['listId', 'startDate', 'endDate'],
      properties: {
        listId: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        path: { type: 'string' }
      }
    }
  };
  
export const timeMetricationResponseSchema = {
  200: {
    type: 'object',
    properties: {
      file: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          size: { type: 'string' },
          bucket: { type: 'string' }
        }
      },
      report: {
        type: 'object',
        properties: {
          listName: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          totalTickets: { type: 'number' }
        }
      }
    }
  }
}
  export const healthResponseSchema = {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        uptime: { type: 'number' },
        timestamp: { type: 'string' }
      }
    }
  };
  
  export const createReportSchema = {

    type: 'object',
    required: ['folderId', 'startDate', 'endDate', 'path'],
    properties: {
      folderId: { type: 'string' },
      startDate: { type: 'string' },
      endDate: { type: 'string' },
      path: { type: 'string' },
      exceptForLists: { type: 'array', items: { type: 'string' } }
    }
  };

  export const createReportSuccessSchema = {
    200: {
      type: 'object',
      properties: {
        file: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            path: { type: 'string' },
            size: { type: 'string' },
            bucket: { type: 'string' }
          }
        },
        report: {
          type: 'object',
          properties: {
            folderId: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
          }
        }
      }
    }
  };

  export const categorizeSuccessSchema = {
    202: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: true },
        message: { type: 'string' }
      }
    }
  };
  
  export const saveTicketsSuccessSchema = {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            list: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                totalTasks: { type: 'number' }
              }
            },
            file: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                bucket: { type: 'string' },
                gcpPath: { type: 'string' },
                size: { type: 'string' },
                uploadResult: { type: 'object' }
              }
            },
            statistics: {
              type: 'object',
              properties: {
                totalTasks: { type: 'number' },
                tasksWithTags: { type: 'number' },
                tasksWithoutTags: { type: 'number' }
              }
            },
            processingTime: { type: 'string' }
          }
        }
      }
    }
  };