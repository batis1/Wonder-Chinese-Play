import React, { useState, createRef } from "react";
import axios from "axios";
import { Header, Grid, Icon, Message, Loader } from "semantic-ui-react";
import { Button } from "antd";
import { MainWrapper } from "./HskOcrSC";
import imageCompression from 'browser-image-compression';
import hsk1Words from './hsk1.json';
import hsk2Words from './hsk2.json';
import hsk3Words from './hsk3.json';
import hsk4Words from './hsk4.json';
import hsk5Words from './hsk5.json';
import hsk6Words from './hsk6.json';
import apiList /* , { server } */ from "../../lib/apiList";

function HskOcr() {
  const [imgSrc, setImgSrc] = useState(null);
  const [textOcr, setTextOcr] = useState(null);
  const [load, setLoad] = useState(false);
  let fileInputRef = createRef();
  const [matchedWords, setMatchedWords] = useState([]);

  const preprocessImage = async (imageData) => {
    try {
      const fetchResponse = await fetch(imageData);
      const blob = await fetchResponse.blob();
      
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.7,
      };

      const compressedFile = await imageCompression(blob, options);
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(compressedFile);
      });
    } catch (error) {
      //console.error('Error preprocessing image:', error);
      throw error;
    }
  };

  const findHSKMatches = (text) => {
    // const matches = []; // Remove this as it's not being used
    
    // Create a single array of all words with their HSK level
    const allHskWords = [
      ...hsk1Words.words.map(word => ({ ...word, level: 1, color: '#FF8A8A', bgColor: '#FFF1F1', borderColor: '#FFD1D1' })),
      ...hsk2Words.words.map(word => ({ ...word, level: 2, color: '#4CAF50', bgColor: '#F1F8E9', borderColor: '#C5E1A5' })),
      ...hsk3Words.words.map(word => ({ ...word, level: 3, color: '#3F51B5', bgColor: '#E8EAF6', borderColor: '#C5CAE9' })),
      ...hsk4Words.words.map(word => ({ ...word, level: 4, color: '#FF9800', bgColor: '#FFF3E0', borderColor: '#FFE0B2' })),
      ...hsk5Words.words.map(word => ({ ...word, level: 5, color: '#9C27B0', bgColor: '#F3E5F5', borderColor: '#E1BEE7' })),
      ...hsk6Words.words.map(word => ({ ...word, level: 6, color: '#00BCD4', bgColor: '#E0F7FA', borderColor: '#B2EBF2' }))
    ];

    // Sort by length (longest first) to match longer words before shorter ones
    allHskWords.sort((a, b) => b.hanzi.length - a.hanzi.length);

    // Create a map to store unique matches
    const uniqueMatches = new Map();

    let remainingText = text;
    // let position = 0; // Remove this as it's not being used

    while (remainingText.length > 0) {
      let matched = false;
      
      for (const word of allHskWords) {
        if (remainingText.startsWith(word.hanzi)) {
          if (!uniqueMatches.has(word.hanzi)) {
            uniqueMatches.set(word.hanzi, word);
          }
          remainingText = remainingText.slice(word.hanzi.length);
          // position += word.hanzi.length; // Remove this line
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        remainingText = remainingText.slice(1);
        // position += 1; // Remove this line
      }
    }

    // Convert unique matches back to array
    return Array.from(uniqueMatches.values());
  };

  const upload = async (file) => {
    try {
      setLoad(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        apiList.ocr.upload,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const matches = findHSKMatches(response.data.text);
      setMatchedWords(matches);
      setTextOcr(response.data.text);
      setImgSrc(response.data.image);
      setLoad(false);
    } catch (error) {
      //console.error('Upload error:', error);
      setLoad(false);
    }
  };

  return (
    <MainWrapper>
      <center>
      <Header style={{ fontSize: "0.9rem" }}>
            <span
                style={{
                color: "#e9ce2c",
                textDecoration: "underline",
                textDecorationColor: "#bf211e",
                }}
            >
                Note:
            </span>
            <span style={{ color: "#c4c4c4" }}> The HSK OCR is working but still in testing.</span>
     </Header>
      </center>
      <Grid divided>
        <div className="divider">
          <Grid.Column style={{ width: "80%" }} key={0}>
            <div className="webcam-container" style={{
              background: "rgba(255, 255, 255, 0.05)",
              transition: "transform 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                background: "rgba(255, 255, 255, 0.08)"
              }
            }}>
              <div className="button-group">
                <Button
                  size="big"
                  onClick={() => fileInputRef.current.click()}
                  icon
                  labelPosition="left"
                  inverted
                  color="blue"
                  className="btn homebtn white"
                >
                  <Icon name="upload" />
                  Upload
                  <form encType="multipart/form-data">
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      name="filename"
                      onChange={(x) => {
                        upload(x.target.files[0]);
                      }}
                      accept="image/*"
                    />
                  </form>
                </Button>
              </div>
            </div>
          </Grid.Column>

          <Grid.Column style={{ width: "80%" }} key={1}>
            <div className="result-container" style={{
              background: "rgba(255, 255, 255, 0.05)",
              transition: "transform 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                background: "rgba(255, 255, 255, 0.08)"
              }
            }}>
              {load ? (
                <Loader style={{ marginTop: 120 }} active inline="centered" size="big">
                  Loading...
                </Loader>
              ) : imgSrc ? (
                <>
                  <Header style={{ 
                    margin: 10, 
                    fontFamily: "roboto",
                    color: "white",
                    fontSize: "clamp(1rem, 2vw, 1.25rem)",
                    lineHeight: "1.6"
                  }} size="large">
                    Result
                  </Header>
                  <img style={{ width: "100%", height: "auto" }} alt="captured" src={imgSrc} />
                  <Message
                    size="massive"
                    color="orange"
                    content={
                      <div>
                        <div className="original-text" style={{ 
                          fontSize: '1.2rem', 
                          marginBottom: '1.5rem',
                          lineHeight: '1.8'
                        }}>
                          {textOcr}
                        </div>
                        <div style={{ 
                          marginTop: '1.5rem',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.8rem'
                        }}>
                          {matchedWords.map((word, index) => (
                            <div
                              key={index}
                              style={{
                                backgroundColor: word.bgColor,
                                color: word.color,
                                padding: '0.6rem 1rem',
                                margin: '0.2rem',
                                borderRadius: '8px',
                                display: 'inline-block',
                                border: `1px solid ${word.borderColor}`,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                fontSize: '1rem',
                                lineHeight: '1.5',
                                transition: 'transform 0.2s ease',
                                cursor: 'pointer',
                                position: 'relative',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                              }}
                            >
                              <div style={{ fontWeight: '600', marginBottom: '0.3rem' }}>
                                {word.hanzi}
                              </div>
                              <div style={{ 
                                fontSize: '0.9rem', 
                                color: '#666',
                                marginBottom: '0.2rem' 
                              }}>
                                {word.pinyin}
                              </div>
                              <div style={{ 
                                fontSize: '0.9rem',
                                color: '#444' 
                              }}>
                                {word.english}
                              </div>
                              <div style={{ 
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                backgroundColor: word.color,
                                color: 'white',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                              }}>
                                {word.level}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    }
                    style={{ margin: 15, padding: '1.5rem' }}
                  />
                </>
              ) : (
                <div 
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "1.5em",
                    borderRadius: "10px",
                    transition: "transform 0.2s ease",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "300px",
                    cursor: "default",
                    width: "100%",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  }}
                >
                  <Header
                    style={{
                      fontFamily: "roboto",
                      color: "white",
                      fontSize: "clamp(1rem, 2vw, 1.25rem)",
                      lineHeight: "1.6"
                    }}
                    size="large"
                  >
                    No data preview
                  </Header>
                </div>
              )}
            </div>
          </Grid.Column>
        </div>
      </Grid>
    </MainWrapper>
  );
}

export default HskOcr;