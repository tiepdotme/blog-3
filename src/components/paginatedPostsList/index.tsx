import Link from "gatsby-link";
import * as React from "react";

import TagsList from "../tagsList";

import { TagID } from "../../types/tags";
import { Language, translations } from "../../utils/translations";
import Pagination from "../pagination";

import { FaCalendar as Calendar, FaTags as Tags } from "react-icons/lib/fa";

export interface PostMeta {
  frontmatter: {
    id: number;
    title: string;
    lang: Language;
    create: string;
    categories: TagID[];
  };
  excerpt: string;
}

export default class PaginatedPostsList extends React.Component {
  public props: {
    posts: PostMeta[];
    lang: Language;
    currentPage: number;
    pagesCount: number;
  };

  public render() {
    const { posts, lang, currentPage, pagesCount } = this.props;

    const style = require("./paginatedPostsList.module.css");

    return (
      <div>
        {posts.map(post => {
          return (
            <article key={post.frontmatter.title} className={style.post}>
              <h3 className={style.header}>
                <Link to={`/${post.frontmatter.lang}/${post.frontmatter.id}`}>
                  {post.frontmatter.title}
                </Link>
              </h3>
              <div className={style.postMeta}>
                <span className={style.date}>
                  <Calendar className={style.icon} data-tip="Date" size={14} />
                  {post.frontmatter.create}
                </span>
                <span className={style.tags}>
                  <Tags className={style.icon} data-tip="Tags" size={14} />
                  <TagsList tags={post.frontmatter.categories} lang={post.frontmatter.lang} />
                </span>
              </div>
              <p className={style.excerpt}>{post.excerpt}</p>

              <Link
                className={style.readmore}
                to={`/${post.frontmatter.lang}/${post.frontmatter.id}`}
                aria-label={post.frontmatter.title}
              >
                {translations[lang]["readmore"]}
              </Link>
            </article>
          );
        })}
        <Pagination lang={lang} currentPage={currentPage} pagesCount={pagesCount} />
      </div>
    );
  }
}
