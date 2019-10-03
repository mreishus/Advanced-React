import React, { Component } from "react";
import PropTypes from "prop-types";

import PaginationStyles from "./styles/PaginationStyles";
import gql from "graphql-tag";
import { Query } from "react-apollo";
import { perPage } from "../config";
import Head from "next/head";
import Link from "next/link";

const PAGINATION_QUERY = gql`
  query PAGINATION_QUERY {
    itemsConnection {
      aggregate {
        count
      }
    }
  }
`;

class Pagination extends React.Component {
  render() {
    return (
      <Query query={PAGINATION_QUERY}>
        {({ data, error, loading }) => {
          if (loading) return <p>Loading...</p>;
          if (error) return <p>Error: {error.message}</p>;
          const count = data.itemsConnection.aggregate.count;
          const page = this.props.page;
          const pages = Math.ceil(count / perPage);
          return (
            <PaginationStyles>
              <Head>
                <title>
                  Sick Fits | Page {page} of {pages}
                </title>
              </Head>
              <Link
                prefetch
                href={{
                  pathname: "items",
                  query: { page: page - 1 }
                }}
              >
                <a className="prev" aria-disabled={page <= 1}>
                  Prev
                </a>
              </Link>
              <p>
                Page {page} of {pages}
              </p>
              <p>{count} items total</p>
              <Link
                prefetch
                href={{
                  pathname: "items",
                  query: { page: page + 1 }
                }}
              >
                <a className="next" aria-disabled={page >= pages}>
                  Next
                </a>
              </Link>
            </PaginationStyles>
          );
        }}
      </Query>
    );
  }
}
export default Pagination;
