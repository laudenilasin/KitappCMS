/* # ---------------------------------------------
# ---------------------------------------------
# Author: Joseph Ian Balucan
# Date:   2018-11-19 09:20:34
# Last Modified by: John Lester Serrano
# Last Modified time: 2018-12-25 09:40:54
# ---------------------------------------------
# ---------------------------------------------*/
const axios = require('axios');
const aws4 = require('aws4');
const request = require('request');
const https = require('https');

function isEmpty(obj) {
  for (const key in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) { return false; }
  }
  return true;
}
function esBulk(url, data) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      url,
      headers: { 'content-type': 'application/x-ndjson' },
      body: data,
    };

    request(options, (error, response, body) => {
      if (error) {
        resolve(error);
      } else {
        resolve(JSON.parse(body));
      }
    });
  });
}

function es(hostname) {
  if (!hostname || hostname === '') {
    throw Error('Missing hostname');
  }
  const agent = new https.Agent({  
    rejectUnauthorized: false
  });
  this.hostname = hostname;
  this.post = async (path, data) => {
    const url = `${this.hostname}/${path}`;
    let response = '';
    const host = this.hostname.replace(/^(https?:|)\/\//, '');
    try {
      const request = {
        host,
        method: 'POST',
        url: `${url}`,
        data,
        body: JSON.stringify(data),
        path: `${path}`,
        service: 'es',
        headers: {
          'content-type': 'application/json',
        },
        httpsAgent : agent,
      };
      response = await axios(request);
    } catch (e) {
      console.log('POST ERROR', e.response.data)
    }
    return response;
  };
  this.bulk = async (data) => {
    const url = `${this.hostname}/_bulk`;
    let response = '';
    try {
      response = await esBulk(url, data);
      console.log('POST', response.items);
    } catch (e) {
      console.log('POST ERROR', e.response.data);
    }
    return response;
  };
  this.delete = async (index, id = '') => {
    const path = `${index}/_doc/${id}`;
    let response;
    const data = {};
    const url = `${this.hostname}/${path}`;
    const host = this.hostname.replace(/^(https?:|)\/\//, '');
    try {
      const request = {
        host,
        method: 'DELETE',
        url: `${url}`,
        data,
        path: `${path}`,
        service: 'es',
      };
      response = await axios(request);
    } catch (e) {
      if (e.response.data.result === 'not_found') {
        throw Error('RECORD_LIST_ERR');
      } else {
        console.log(e.response.data);
        throw Error('ES Exception occurred during DELETE:', e);
      }
    }
    return response.data.result;
  };
  this.countDocuments = async (index, query) => {
    const path = `${index}/_count`;
    let response;
    const data = {};
    const url = `${this.hostname}/${path}`;
    const host = this.hostname.replace(/^(https?:|)\/\//, '');
    try {
      const request = {
        host,
        method: 'GET',
        url: `${url}`,
        data : query,
        body: JSON.stringify(query),
        path: `${path}`,
        service: 'es',
      };
      response = await axios(request);
    } catch (e) {
      if (e.response.data.error.type === 'index_not_found_exception') {
        throw Error('NO SUCH INDEX');
      } else {
        console.log(e.response.data);
        throw Error('ES Exception occurred during DELETE:', e);
      }
    }
    return response.data.count;
  };
  this.countAvailability = async (index, data, aggregation) => {
    const path = `${index}/_doc/_search`;
    const result = [];
    const body = {
      size: 0,
      query: {
        bool: {
        },
      },
      aggs: aggregation,
    };
    if (data) {
      body.query.bool = data;
    }
    try {
      const response = await this.post(path, body);
      const count = response.data.aggregations.filtered;
      if (count.doc_count !== 0) {
        for (let i = 0; i < count.data.buckets.length; i += 1) {
          if (count.data.buckets[i].doc_count !== 0) {
            result.push({
              date: count.data.buckets[i].key_as_string,
              available: 1,
            });
          } else {
            result.push({
              date: count.data.buckets[i].key_as_string,
              available: 0,
            });
          }
        }
      }
    } catch (e) {
      throw Error('ES Exception occurred during SEARCH:', e);
    }

    return result;
  };

  // this.get = async () => {
  //   const url = `${this.hostname}/mp-users/_doc/_search?scroll=1m`;
  //   let response = {};
  //   let docs = [];
  //   let scrollId;
  //   try {
  //     response = await axios.post(url);
  //     console.log(response);
  //     docs = [response.hits];
  //     scrollId = response._scroll_id;
  //     while (true) {
  //       response = await axios.post(`${this.hostname}/_search/scroll`, scrollId)
  //       docs.push(response.hits)
  //       scroll_id = response._scroll_id
  //    }
  //   } catch (e) {
  //     console.log(e);
  //     // throw Error('ES Exception occurred during GET:', e);
  //   }
  //   return docs;
  // };

  this.create = async (index, data, id = '') => {
    const path = `${index}/_doc/${id}?refresh=wait_for`;
    let response;
    try {
      console.log('in')
      response = await this.post(path, data);
      console.log(response);
    } catch (e) {
      throw Error('ES Exception occurred during POST:', e);
    }
    return response.data.result;
  };

  this.update = async (index, data, id = '') => {
    const path = `${index}/_doc/${id}/_update`;
    let response;
    try {
      response = await this.post(path, data);
    } catch (e) {
      throw Error('ES Exception occurred during UPDATE:', e);
    }
    return response.data.result;
  };

  this.search = async (index) => {
    const path = `${index}/_doc/_search`;
    let response = '';
    const result = [];
    const body = {
      query: {
        match_all: {},
      },
    };
    try {
      response = await this.post(path, body);
      const dataResult = response.data.hits.hits;
      response = dataResult;
      for (let i = 0; i < response.length; i += 1) {
        result.push(response[i]._source);
      }
    } catch (e) {
      throw Error('ES Exception occurred during SEARCH:', e);
    }
    return result;
  };

  this.matchAllDocument = async (index) => {
    const path = `${index}/_doc/_search`;
    let response = '';
    let result = '';
    const body = {
      query: {
        match_all: {},
      },
    };
    try {
      response = await this.post(path, body);
      if (response.data.hits.total !== 0) {
        result = response.data.hits.hits[0]._source;
      } else {
        result = response.data.hits.hits;
      }
    } catch (e) {
      throw Error('ES Exception occurred during SEARCH:', e);
    }
    return result;
  };

  this.matchAllDocuments = async (index, size, sort) => {
    const path = `${index}/_doc/_search`;
    let response = '';
    let result = [];
    const body = {
      size,
      sort,
      query: {
        match_all: {},
      },
    };
    try {
      response = await this.post(path, body);
      const resultData = response.data.hits;
      if (response.data.hits.total !== 0) {
        for (let i = 0; i < resultData.hits.length; i += 1) {
          result.push(resultData.hits[i]._source);
        }
      } else {
        result = resultData.hits;
      }
    } catch (e) {
      throw Error('ES Exception occurred during SEARCH:', e);
    }
    return result;
  };

  // this.getById = async (index, id) => {
  //   const path = `${index}/_doc/${id}`; // TODO: change to _doc
  //   let response = '';
  //   try {
  //     response = await this.get(path);
  //     response = response.data._source;
  //   } catch (e) {
  //     throw Error('ES Exception occurred during GETBYID:', e);
  //   }
  //   return response;
  // };

  // this.getByQuery = async (index, query) => {
  //   const path = `${index}/_doc/_search?q=${query}`;
  //   let response = '';

  //   try {
  //     const esResponse = await this.get(path);

  //     response = {
  //       status: esResponse.status,
  //       statusText: esResponse.statusText,
  //     };

  //     if (esResponse.status === 200) {
  //       const { hits } = esResponse.data;
  //       response.total = hits.total;
  //       response.data = hits.hits.map(hit => hit._source);
  //     }
  //   } catch (e) {
  //     throw Error('ES Exception occurred during GETBYQUERY:', e);
  //   }

  //   return response;
  // };
  this.getAllDocuments = async (index, data, sort, _source) => {
    let response = '';
    const docs = [];
    let scrollId;
    const result = [];
    const size = 0;
    const path = `${index}/_search?scroll=10m`;
    const url = `${this.hostname}/_search/scroll`;
    const host = this.hostname.replace(/^(https?:|)\/\//, '');
    const body = {
      _source,
      sort,
      size: 10000,
      query: {
        bool: {
        },
      },
    };
    if (data) {
      body.query.bool = data;
    }
    
    try {
      response = await this.post(path, body);
      for (let i = 0; i < response.data.hits.hits.length; i += 1) {
        docs.push(response.data.hits.hits[i]._source);
      }
      // docs = [response.data.hits];
      scrollId = response.data._scroll_id;
      while (!isEmpty(response.data.hits.hits)) {
        const requestData = {
          host,
          method: 'POST',
          url: `${url}`,
          data: { scroll: '10m', scroll_id: scrollId },
          body: JSON.stringify({ scroll: '10m', scroll_id: scrollId }),
          path: `${path}`,
          service: 'es',
          headers: {
            'content-type': 'application/json',
          },
        };
        response = await axios(requestData);
        for (let i = 0; i < response.data.hits.hits.length; i += 1) {
          docs.push(response.data.hits.hits[i]._source);
        }
        scrollId = response.data._scroll_id;
      }
    } catch (e) {
      if(e.reason != 'IP: 127.0.0.1 is not in the cert\'s list: '){
        console.log(e);
      }
      // throw Error('ES Exception occurred during POST:', e);
    }
    return docs;
  };
  // for single record
  // this.getDocumentThatMust = async (index, must) => {
  //   const path = `${index}/_doc/_search`;
  //   let response = '';
  //   const body = {
  //     query: {
  //       bool: {
  //         must: { term: { field: 'value' } },
  //       },
  //     },
  //   };

  //   if (must) {
  //     body.query.bool.must = must;
  //   }

  //   try {
  //     response = await this.post(path, body);
  //     const documents = response.data.hits.hits;
  //     response = documents[0]._source;
  //   } catch (e) {
  //     throw Error('ES Exception occurred during SEARCH:', e);
  //   }

  //   return response;
  // };

  // this.filterDocuments = async (index, filter) => {
  //   const path = `${index}/_doc/_search`; // TODO change to _doc
  //   let response = '';
  //   const body = {
  //     from: 0,
  //     size: 1000,
  //     query: {
  //       bool: {
  //         filter: { term: filter },
  //       },
  //     },
  //   };
  //   if (filter) {
  //     body.query.bool.filter.term = filter;
  //   }
  //   const result = [];
  //   try {
  //     response = await this.post(path, body);
  //     const dataResult = response.data.hits.hits;
  //     response = dataResult;
  //     for (let i = 0; i < response.length; i += 1) {
  //       result.push(response[i]._source);
  //     }
  //   } catch (e) {
  //     throw Error('ES Exception occurred during SEARCH:', e);
  //   }
  //   return result;
  // };
  this.historgram = async (index, data, aggregation) => {
    const path = `${index}/_doc/_search`;
    const result = [];
    const body = {
      size: 0,
      query: {
        bool: {
        },
      },
      aggs: aggregation,
    };
    if (data) {
      body.query.bool = data;
    }
    try {
      const response = await this.post(path, body);
      const count = response.data.aggregations.filtered;
      console.log(count);
      if (count.doc_count !== 0) {
        for (let i = 0; i < count.data.buckets.length; i += 1) {
          result.push({ date: count.data.buckets[i].key_as_string, count: count.data.buckets[i].doc_count });
        }
      }
    } catch (e) {
      throw Error('ES Exception occurred during SEARCH:', e);
    }

    return result;
  };

  this.matchDocument = async (index, match, _source) => {
    const path = `${index}/_doc/_search`;
    let result = '';
    const body = {
      _source,
      query: {
        match,
      },
    };
    try {
      const response = await this.post(path, body);
      if (response.data.hits.total !== 0) {
        result = response.data.hits.hits[0]._source;
      } else {
        result = response.data.hits.hits;
      }
    } catch (e) {
      throw Error('ES Exception occurred during SEARCH:', e);
    }
    if(result.length == 0){
      result = {};
    }
    return result;
  };


  this.matchDocuments = async (index, match) => {
    const path = `${index}/_doc/_search`;
    let response = '';

    const result = [];
    const body = {
      size: 100,
      query: {
        match,
      },
    };
    try {
      response = await this.post(path, body);
      const dataResult = response.data.hits.hits;
      response = dataResult;
      for (let i = 0; i < response.length; i += 1) {
        result.push(response[i]._source);
      }
    } catch (e) {
      throw Error('ES Exception occurred during SEARCH:', e);
    }

    return result;
  };
  // TODO:filter
  this.mustMatchDocuments = async (index, data, page, sort, size, _source) => {
    const path = `${index}/_doc/_search`;
    const list = [];
    let result = {};

    let response = '';
    const body = {
      _source,
      from: page,
      size,
      sort,
      query: {
        bool: {
          must: [
            { match: { user_id: '' } },
            { match: { profile_id: '' } },
          ],
        },
      },
    };
    if (data) {
      body.query.bool = data;
      if('multi_match' in data)
      {
        body.query = data;
      }
    }

    try {
      response = await this.post(path, body);
      const dataResult = response.data.hits;
      if (response.data.hits.total !== 0) {
        for (let i = 0; i < dataResult.hits.length; i += 1) {
          list.push(dataResult.hits[i]._source);
        }

        if (page) {
          result.total = 0;
          result.data = [];
          result.total = response.data.hits.total;
          result.data = list;
        } else {
          result = list;
        }
      }
    } catch (e) {
      console.log(e);
      throw Error('ES Exception occurred during SEARCH:', e);
    }
    return result;
  };

  this.mustMatchDocument = async (index, data, _source) => {
    const path = `${index}/_doc/_search`;
    let result = {};
    const body = {
      _source,
      query: {
        bool: {
          must: [
            { match: { user_id: '' } },
          ],
        },
      },
    };
    if (data) {
      body.query.bool = data;
    }
    try {
      const response = await this.post(path, body);
      console.log('hits',response.data.hits.hits)
      if (response.data.hits.total !== 0) {
        result = response.data.hits.hits[0]._source;
      }
    } catch (e) {
      throw Error('ES Exception occurred during SEARCH:', e);
    }
    return result;
  };


  this.multiMatchDocument = async (index, search) => {
    const path = `${index}/_doc/_search`;
    let response = '';
    const result = [];
    const body = {
      size: 100,
      query: {
        multi_match: {
          query: search,
          fields: ['type'],
        },
      },
    };
    try {
      response = await this.post(path, body);
      const dataResult = response.data.hits.hits;
      response = dataResult;
      for (let i = 0; i < response.length; i += 1) {
        result.push(response[i]._source);
      }
    } catch (e) {
      throw Error('ES Exception occurred during SEARCH:', e);
    }

    return result;
  };

  this.matchFilterDocuments = async (index, match, isBaby, isSenior) => {
    const path = `${index}/_doc/_search`;
    let response = '';
    const result = [];
    const body = {
      from: 0,
      size: 1000,
      query: {
        bool: {
          must: [
            { match },
          ],
          filter: [
            { term: isBaby },
            { term: isSenior },
          ],
        },
      },
    };
    try {
      response = await this.post(path, body);
      const dataResult = response.data.hits.hits;
      response = dataResult;
      for (let i = 0; i < response.length; i += 1) {
        result.push(response[i]._source);
      }
    } catch (e) {
      throw Error('ES Exception occurred during SEARCH:', e);
    }

    return result;
  };
}
module.exports = es;
